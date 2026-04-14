import { NextRequest, NextResponse } from 'next/server';
import { mockTransactions } from '@/lib/mock-data';
import type { Transaction } from '@/types';

// ─── GET /api/v1/payments ────────────────────────────────────────────────────
// Returns a paginated, filterable list of transactions.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page      = Math.max(1, parseInt(searchParams.get('page')     ?? '1', 10));
  const per_page  = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10)));
  const status    = searchParams.get('status')?.toUpperCase();
  const gateway   = searchParams.get('gateway')?.toUpperCase();
  const method    = searchParams.get('method')?.toLowerCase();
  const search    = searchParams.get('search')?.toLowerCase();
  const from      = searchParams.get('from');
  const to        = searchParams.get('to');
  const min_amount = searchParams.get('min_amount') ? Number(searchParams.get('min_amount')) : null;
  const max_amount = searchParams.get('max_amount') ? Number(searchParams.get('max_amount')) : null;
  const sort      = searchParams.get('sort') ?? '-createdAt'; // prefix '-' = descending

  let filtered: Transaction[] = [...mockTransactions];

  // Apply filters
  if (status)  filtered = filtered.filter(t => t.status === status);
  if (gateway) filtered = filtered.filter(t => t.gateway === gateway);
  if (method)  filtered = filtered.filter(t => t.paymentMethod === method);
  if (from)    filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(from));
  if (to)      filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(to));
  if (min_amount !== null) filtered = filtered.filter(t => t.amount >= min_amount);
  if (max_amount !== null) filtered = filtered.filter(t => t.amount <= max_amount);
  if (search) {
    filtered = filtered.filter(t =>
      t.id.toLowerCase().includes(search) ||
      t.customerEmail?.toLowerCase().includes(search) ||
      t.gatewayOrderId?.toLowerCase().includes(search) ||
      (t.metadata as Record<string, string> | undefined)?.orderId?.toLowerCase().includes(search)
    );
  }

  // Apply sort
  const sortField  = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortDir    = sort.startsWith('-') ? -1 : 1;
  filtered.sort((a, b) => {
    const av = ((a as unknown) as Record<string, unknown>)[sortField] as string | number ?? '';
    const bv = ((b as unknown) as Record<string, unknown>)[sortField] as string | number ?? '';
    return av < bv ? -sortDir : av > bv ? sortDir : 0;
  });

  // Paginate
  const total  = filtered.length;
  const pages  = Math.ceil(total / per_page);
  const offset = (page - 1) * per_page;
  const data   = filtered.slice(offset, offset + per_page);

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, per_page, total, pages },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
  });
}

// ─── POST /api/v1/payments ───────────────────────────────────────────────────
// Creates a payment intent and returns a hosted payment URL / QR code.
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    amount,
    currency = 'INR',
    customer,
    gateway_preference,
    idempotency_key,
    metadata,
  } = body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_AMOUNT', message: 'amount must be a positive number (in paise)' },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  if (!customer?.email && !customer?.phone) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_CUSTOMER',
          message: 'At least one of customer.email or customer.phone is required',
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  const transactionId   = `txn_${Math.random().toString(36).slice(2, 10)}`;
  const gatewayOrderId  = `order_Mock_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const selectedGateway = gateway_preference ?? 'RAZORPAY';
  const expiresAt       = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // +15 min

  return NextResponse.json(
    {
      success: true,
      data: {
        transaction_id:  transactionId,
        gateway_order_id: gatewayOrderId,
        gateway:         selectedGateway,
        amount,
        currency,
        status:          'PENDING',
        payment_url:     `https://pay.mockgateway.io/checkout/${transactionId}`,
        qr_code_url:     `https://pay.mockgateway.io/qr/${transactionId}.png`,
        expires_at:      expiresAt,
        idempotency_key: idempotency_key ?? null,
        customer,
        metadata: metadata ?? {},
        created_at:      new Date().toISOString(),
      },
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    },
    { status: 201 }
  );
}
