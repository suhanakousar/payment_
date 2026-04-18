import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const meta = () => ({ request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const transaction = await prisma.transaction.findUnique({
      where:   { id },
      include: { webhookLogs: { orderBy: { receivedAt: 'desc' }, take: 10 } },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `Transaction '${id}' not found` }, meta: meta() },
        { status: 404 }
      );
    }

    // Build timeline from transaction state
    const timeline = [
      { step: 'INITIATED',       description: 'Payment intent created',                       timestamp: transaction.createdAt, actor: 'SYSTEM' },
      { step: 'GATEWAY_CREATED', description: `Order created on ${transaction.gateway}`,      timestamp: transaction.createdAt, actor: 'GATEWAY' },
      ...(transaction.status === 'AUTHORIZED' || transaction.status === 'CAPTURED' ? [
        { step: 'AUTHORIZED',    description: 'Payment authorized by bank',                   timestamp: transaction.updatedAt, actor: 'GATEWAY' },
      ] : []),
      ...(transaction.status === 'CAPTURED' ? [
        { step: 'CAPTURED',      description: 'Payment captured successfully',                timestamp: transaction.updatedAt, actor: 'GATEWAY' },
      ] : []),
      ...(transaction.status === 'FAILED' ? [
        { step: 'FAILED',        description: 'Payment failed',                               timestamp: transaction.updatedAt, actor: 'GATEWAY' },
      ] : []),
      ...(transaction.status === 'REFUNDED' || transaction.status === 'PARTIALLY_REFUNDED' ? [
        { step: 'REFUNDED',      description: 'Refund processed',                             timestamp: transaction.updatedAt, actor: 'MERCHANT' },
      ] : []),
    ];

    const webhook_events = transaction.webhookLogs.map((wl) => ({
      id:             wl.id,
      event_type:     wl.eventType,
      delivered_at:   wl.receivedAt,
      signature_valid: wl.signatureValid,
      processed:      wl.processed,
    }));

    return NextResponse.json({
      success: true,
      data:    { ...transaction, amount: Number(transaction.amount), webhook_events, timeline },
      meta:    meta(),
    });
  } catch (err) {
    console.error('[GET /payments/:id]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, meta: meta() },
      { status: 500 }
    );
  }
}
