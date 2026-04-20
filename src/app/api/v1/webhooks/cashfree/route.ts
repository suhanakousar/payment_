import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyCashfreeWebhookSignature } from '@/lib/cashfree';

// ─── POST /api/v1/webhooks/cashfree ──────────────────────────────────────────
// Receives Cashfree webhook events, verifies signature, updates transaction.
export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const timestamp = req.headers.get('x-webhook-timestamp') ?? '';
  const signature = req.headers.get('x-webhook-signature') ?? '';

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = (payload.type as string) ?? 'unknown';
  const eventId   = (payload.data as Record<string, unknown>)?.order?.cf_order_id as string
    ?? `cf_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Check for duplicate event
  const duplicate = await prisma.webhookLog.findUnique({ where: { eventId } }).catch(() => null);
  if (duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Verify signature using the merchant's secret key
  // Find transaction first so we can get merchant config
  const orderData    = (payload.data as Record<string, unknown>)?.order as Record<string, unknown> | undefined;
  const cfOrderId    = orderData?.cf_order_id as string | undefined;
  const orderId      = orderData?.order_id    as string | undefined;
  const orderStatus  = orderData?.order_status as string | undefined;
  const paymentData  = (payload.data as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;
  const cfPaymentId  = paymentData?.cf_payment_id as string | undefined;

  // Attempt to find transaction by gatewayOrderId (our internal order_id)
  const txn = orderId
    ? await prisma.transaction.findFirst({
        where: { OR: [{ gatewayOrderId: orderId }, { gatewayOrderId: cfOrderId }] },
      }).catch(() => null)
    : null;

  // Verify signature using merchant secret key
  let signatureValid = false;
  if (txn?.merchantId && signature && timestamp) {
    const cfg = await prisma.merchantConfig.findUnique({
      where: { merchantId: txn.merchantId },
    }).catch(() => null);
    if (cfg?.cashfreeSecretKey) {
      signatureValid = verifyCashfreeWebhookSignature(rawBody, timestamp, signature, cfg.cashfreeSecretKey);
    }
  } else if (!signature && process.env.NODE_ENV === 'development') {
    signatureValid = true;
  }

  // Determine new transaction status
  let newStatus: 'CAPTURED' | 'FAILED' | null = null;
  if (eventType === 'PAYMENT_SUCCESS' || orderStatus === 'PAID')   newStatus = 'CAPTURED';
  if (eventType === 'PAYMENT_FAILED'  || orderStatus === 'EXPIRED') newStatus = 'FAILED';

  let transactionId: string | null = null;

  if (txn && newStatus) {
    try {
      await prisma.transaction.update({
        where: { id: txn.id },
        data:  {
          status:           newStatus,
          gatewayPaymentId: cfPaymentId ? String(cfPaymentId) : txn.gatewayPaymentId,
        },
      });
      transactionId = txn.id;
    } catch (err) {
      console.error('[cashfree webhook] transaction update error', err);
    }
  }

  // Log the webhook event
  try {
    await prisma.webhookLog.create({
      data: {
        transactionId,
        source:         'CASHFREE',
        eventType,
        eventId,
        payload:        payload as object,
        signatureValid,
        processed:      !!newStatus && !!transactionId,
      },
    });
  } catch (err) {
    console.error('[cashfree webhook] log error', err);
  }

  return NextResponse.json({ received: true, event: eventType, signature_valid: signatureValid });
}
