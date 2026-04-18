import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// ─── POST /api/v1/webhooks/razorpay ──────────────────────────────────────────
// Receives Razorpay webhook events, verifies signature, updates transaction.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature   = req.headers.get('x-razorpay-signature') ?? '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

  // Verify signature
  let signatureValid = false;
  if (webhookSecret && signature) {
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    signatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );
  } else {
    // In development without webhook secret, allow processing
    signatureValid = process.env.NODE_ENV === 'development';
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = (payload.event as string) ?? 'unknown';
  const eventId   = (payload.payload as Record<string, unknown>)?.id as string
    ?? `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Check for duplicate event
  const duplicate = await prisma.webhookLog.findUnique({ where: { eventId } }).catch(() => null);
  if (duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Extract payment / order data
  const paymentPayload = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;
  const entity         = paymentPayload?.entity as Record<string, unknown> | undefined;
  const gatewayOrderId = entity?.order_id as string | undefined;
  const gatewayPaymentId = entity?.id as string | undefined;
  const rzpStatus      = entity?.status as string | undefined;

  // Determine new transaction status
  let newStatus: 'CAPTURED' | 'FAILED' | null = null;
  if (eventType === 'payment.captured') newStatus = 'CAPTURED';
  if (eventType === 'payment.failed')   newStatus = 'FAILED';

  let transactionId: string | null = null;

  // Update transaction if we have matching order ID
  if (gatewayOrderId && newStatus) {
    try {
      const txn = await prisma.transaction.findFirst({ where: { gatewayOrderId } });
      if (txn) {
        await prisma.transaction.update({
          where: { id: txn.id },
          data:  {
            status:            newStatus,
            gatewayPaymentId:  gatewayPaymentId ?? txn.gatewayPaymentId,
          },
        });
        transactionId = txn.id;
      }
    } catch (err) {
      console.error('[webhook] transaction update error', err);
    }
  }

  // Log the webhook event
  try {
    await prisma.webhookLog.create({
      data: {
        transactionId,
        source:         'RAZORPAY',
        eventType,
        eventId,
        payload:        payload as object,
        signatureValid,
        processed:      !!newStatus && !!transactionId,
      },
    });
  } catch (err) {
    console.error('[webhook] log error', err);
  }

  return NextResponse.json({ received: true, event: eventType, signature_valid: signatureValid });
}
