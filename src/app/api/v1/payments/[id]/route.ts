import { NextRequest, NextResponse } from 'next/server';
import { mockTransactions } from '@/lib/mock-data';

// ─── GET /api/v1/payments/:id ────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const transaction = mockTransactions.find(t => t.id === id);

  if (!transaction) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: `Transaction '${id}' not found` },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 404 }
    );
  }

  // Mock webhook events delivered for this transaction
  const webhook_events = [
    {
      id:            `wh_${id}_01`,
      event_type:    'payment.created',
      delivered_at:  transaction.createdAt,
      response_code: 200,
      latency_ms:    142,
      success:       true,
    },
    {
      id:            `wh_${id}_02`,
      event_type:    transaction.status === 'CAPTURED' ? 'payment.captured' : 'payment.updated',
      delivered_at:  transaction.updatedAt,
      response_code: transaction.status === 'FAILED' ? 500 : 200,
      latency_ms:    transaction.status === 'FAILED' ? 3012 : 98,
      success:       transaction.status !== 'FAILED',
    },
  ];

  // Mock timeline / audit trail
  const timeline = [
    {
      step:        'INITIATED',
      description: 'Payment intent created',
      timestamp:   transaction.createdAt,
      actor:       'SYSTEM',
    },
    {
      step:        'GATEWAY_CREATED',
      description: `Order created on ${transaction.gateway}`,
      timestamp:   transaction.createdAt,
      actor:       'GATEWAY',
    },
    ...(transaction.status === 'CAPTURED'
      ? [
          {
            step:        'AUTHORIZED',
            description: 'Payment authorized by bank',
            timestamp:   transaction.updatedAt,
            actor:       'GATEWAY',
          },
          {
            step:        'CAPTURED',
            description: 'Payment captured successfully',
            timestamp:   transaction.updatedAt,
            actor:       'GATEWAY',
          },
        ]
      : []),
    ...(transaction.status === 'FAILED'
      ? [
          {
            step:        'FAILED',
            description: `Payment failed — ${(transaction.metadata as Record<string, string>)?.failureCode ?? 'Unknown reason'}`,
            timestamp:   transaction.updatedAt,
            actor:       'GATEWAY',
          },
        ]
      : []),
    ...(transaction.status === 'REFUNDED' || transaction.status === 'PARTIALLY_REFUNDED'
      ? [
          {
            step:        'REFUNDED',
            description: 'Refund processed',
            timestamp:   transaction.updatedAt,
            actor:       'MERCHANT',
          },
        ]
      : []),
  ];

  return NextResponse.json({
    success: true,
    data: {
      ...transaction,
      webhook_events,
      timeline,
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
  });
}
