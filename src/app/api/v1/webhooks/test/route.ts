import { NextRequest, NextResponse } from 'next/server';

type WebhookEventType =
  | 'payment.created'
  | 'payment.captured'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payout.queued'
  | 'payout.processed'
  | 'payout.failed';

const VALID_EVENT_TYPES: WebhookEventType[] = [
  'payment.created',
  'payment.captured',
  'payment.failed',
  'payment.refunded',
  'payout.queued',
  'payout.processed',
  'payout.failed',
];

// ─── POST /api/v1/webhooks/test ───────────────────────────────────────────────
// Sends a test webhook to the configured endpoint and returns delivery result.
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    event_type = 'payment.captured',
    webhook_url,
    payload_override,
  } = body as {
    event_type?:       WebhookEventType;
    webhook_url?:      string;
    payload_override?: Record<string, unknown>;
  };

  if (!VALID_EVENT_TYPES.includes(event_type as WebhookEventType)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_EVENT_TYPE',
          message: `event_type must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  // Mock target URL (merchant-configured or override)
  const targetUrl = webhook_url ?? 'https://api.arjunretail.in/webhooks/payment';

  // Build mock test payload
  const testPayload = payload_override ?? {
    event:     event_type,
    event_id:  `evt_test_${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    data: {
      id:              'txn_test_mock123',
      status:          event_type.includes('captured') ? 'CAPTURED'
        : event_type.includes('failed')   ? 'FAILED'
        : event_type.includes('refunded') ? 'REFUNDED'
        : 'PENDING',
      amount:          49900,
      currency:        'INR',
      gateway:         'RAZORPAY',
      merchant_id:     'mrc_9f2a1b3c',
      gateway_order_id: 'order_Test_MockXYZ123',
      created_at:      new Date().toISOString(),
    },
    webhook_test: true,
  };

  // Simulate delivery: ~85% success, 10% timeout, 5% HTTP error
  const roll = Math.random();
  const isSuccess = roll > 0.15;
  const isTimeout = roll >= 0.85 && roll < 0.95;

  const latency_ms   = isTimeout ? 30_000 : Math.floor(80 + Math.random() * 400);
  const response_code = isSuccess ? 200 : isTimeout ? 0 : 500;
  const responseBody  = isSuccess
    ? '{"received":true}'
    : isTimeout
    ? null
    : '{"error":"Internal Server Error"}';

  const deliveryId = `dlv_${Math.random().toString(36).slice(2, 10)}`;
  const now        = new Date().toISOString();

  return NextResponse.json({
    success: true,
    data: {
      delivery_id:    deliveryId,
      event_type,
      target_url:     targetUrl,
      delivered:      isSuccess,
      response_code,
      latency_ms,
      response_body:  responseBody,
      timed_out:      isTimeout,
      payload_sent:   testPayload,
      signature:      `sha256=mock_hmac_${deliveryId}`,
      attempt:        1,
      next_retry_at:  isSuccess ? null : new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      delivered_at:   now,
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: now },
  });
}
