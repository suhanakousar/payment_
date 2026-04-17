import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthUser, isDevBypass } from '@/lib/auth';

const meta = () => ({ request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() });

const createPaymentSchema = z.object({
  amount:              z.number().positive('amount must be a positive number in paise'),
  currency:            z.string().default('INR'),
  customer:            z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    name:  z.string().optional(),
  }).refine((c) => c.email || c.phone, { message: 'At least one of customer.email or customer.phone is required' }),
  gateway_preference:  z.enum(['RAZORPAY', 'CASHFREE', 'STRIPE', 'AUTO']).default('RAZORPAY'),
  idempotency_key:     z.string().optional(),
  metadata:            z.record(z.unknown()).optional(),
});

// ─── GET /api/v1/payments ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page       = Math.max(1, parseInt(searchParams.get('page')     ?? '1', 10));
  const per_page   = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10)));
  const status     = searchParams.get('status')?.toUpperCase();
  const gateway    = searchParams.get('gateway')?.toUpperCase();
  const search     = searchParams.get('search')?.toLowerCase();
  const from       = searchParams.get('from');
  const to         = searchParams.get('to');
  const min_amount = searchParams.get('min_amount') ? Number(searchParams.get('min_amount')) : null;
  const max_amount = searchParams.get('max_amount') ? Number(searchParams.get('max_amount')) : null;

  try {
    const where: Record<string, unknown> = {};
    if (status)  where.status  = status;
    if (gateway) where.gateway = gateway;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to)   (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }
    if (min_amount !== null || max_amount !== null) {
      where.amount = {};
      if (min_amount !== null) (where.amount as Record<string, unknown>).gte = min_amount;
      if (max_amount !== null) (where.amount as Record<string, unknown>).lte = max_amount;
    }
    if (search) {
      where.OR = [
        { id:               { contains: search, mode: 'insensitive' } },
        { customerEmail:    { contains: search, mode: 'insensitive' } },
        { gatewayOrderId:   { contains: search, mode: 'insensitive' } },
        { gatewayPaymentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * per_page,
        take:    per_page,
      }),
    ]);

    const data = rows.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, per_page, total, pages: Math.ceil(total / per_page) },
      meta: meta(),
    });
  } catch (err) {
    console.error('[GET /payments]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// ─── POST /api/v1/payments ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  const devMode  = isDevBypass(req);

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' }, meta: meta() },
      { status: 400 }
    );
  }

  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten().fieldErrors }, meta: meta() },
      { status: 400 }
    );
  }

  const { amount, currency, customer, gateway_preference, idempotency_key, metadata } = parsed.data;

  // Idempotency check
  if (idempotency_key) {
    const existing = await prisma.transaction.findUnique({ where: { idempotencyKey: idempotency_key } });
    if (existing) {
      return NextResponse.json({
        success: true,
        data: { ...existing, amount: Number(existing.amount) },
        meta: meta(),
      });
    }
  }

  // Resolve merchant ID
  let merchantId = authUser?.merchantId ?? null;
  if (!merchantId) {
    const firstMerchant = await prisma.merchant.findFirst({ orderBy: { createdAt: 'asc' } });
    merchantId = firstMerchant?.id ?? null;
  }
  if (!merchantId) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_MERCHANT', message: 'No merchant found. Please complete setup.' }, meta: meta() },
      { status: 400 }
    );
  }

  try {
    let gatewayOrderId: string | null = null;
    let paymentUrl: string;
    let selectedGateway = gateway_preference;

    // Try Razorpay if keys are configured
    const razorpayKeyId     = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (razorpayKeyId && razorpayKeySecret && (gateway_preference === 'RAZORPAY' || gateway_preference === 'AUTO')) {
      try {
        const Razorpay = (await import('razorpay')).default;
        const rzp = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
        const order = await rzp.orders.create({
          amount:   amount,
          currency: currency,
          receipt:  idempotency_key ?? `rcpt_${Date.now()}`,
          notes:    metadata as Record<string, string> | undefined,
        });
        gatewayOrderId = order.id;
        selectedGateway = 'RAZORPAY';
        paymentUrl = `https://rzp.io/i/${order.id}`;
      } catch (rzpErr) {
        console.error('[razorpay order create]', rzpErr);
        gatewayOrderId = `sim_${Date.now()}`;
        paymentUrl = `/checkout/sim_${Date.now()}`;
      }
    } else {
      gatewayOrderId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      paymentUrl = `/checkout/${gatewayOrderId}`;
    }

    const transaction = await prisma.transaction.create({
      data: {
        merchantId,
        gateway:         selectedGateway,
        gatewayOrderId,
        amount:          amount,
        currency,
        status:          'PENDING',
        customerEmail:   customer.email ?? null,
        customerPhone:   customer.phone ?? null,
        idempotencyKey:  idempotency_key ?? null,
        metadata:        metadata ?? {},
      },
    });

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return NextResponse.json(
      {
        success: true,
        data: {
          transaction_id:   transaction.id,
          gateway_order_id: gatewayOrderId,
          gateway:          selectedGateway,
          amount,
          currency,
          status:           'PENDING',
          payment_url:      paymentUrl,
          expires_at:       expiresAt,
          idempotency_key:  idempotency_key ?? null,
          customer,
          metadata:         metadata ?? {},
          created_at:       transaction.createdAt.toISOString(),
          simulated:        !razorpayKeyId,
        },
        meta: meta(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /payments]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, meta: meta() },
      { status: 500 }
    );
  }
}
