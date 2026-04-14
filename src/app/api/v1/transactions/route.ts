import { NextRequest, NextResponse } from 'next/server';
import { mockTransactions } from '@/lib/mock-data';
import type { Transaction } from '@/types';

// ─── GET /api/v1/transactions ─────────────────────────────────────────────────
// Extended version of payments GET with additional filters.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page        = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
  const per_page    = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10)));
  const status      = searchParams.get('status')?.toUpperCase();
  const gateway     = searchParams.get('gateway')?.toUpperCase();
  const method      = searchParams.get('method')?.toLowerCase();
  const search      = searchParams.get('search')?.toLowerCase();
  const from        = searchParams.get('from');
  const to          = searchParams.get('to');
  const min_amount  = searchParams.get('min_amount') ? Number(searchParams.get('min_amount')) : null;
  const max_amount  = searchParams.get('max_amount') ? Number(searchParams.get('max_amount')) : null;
  const sort        = searchParams.get('sort') ?? '-createdAt';
  const merchant_id = searchParams.get('merchant_id');
  const currency    = searchParams.get('currency')?.toUpperCase();
  const has_refund  = searchParams.get('has_refund');   // 'true' | 'false'

  let filtered: Transaction[] = [...mockTransactions];

  // Apply filters
  if (status)      filtered = filtered.filter(t => t.status === status);
  if (gateway)     filtered = filtered.filter(t => t.gateway === gateway);
  if (method)      filtered = filtered.filter(t => t.paymentMethod === method);
  if (currency)    filtered = filtered.filter(t => t.currency === currency);
  if (merchant_id) filtered = filtered.filter(t => t.merchantId === merchant_id);
  if (from)        filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(from));
  if (to)          filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(to));
  if (min_amount !== null) filtered = filtered.filter(t => t.amount >= min_amount);
  if (max_amount !== null) filtered = filtered.filter(t => t.amount <= max_amount);
  if (has_refund === 'true') {
    filtered = filtered.filter(t =>
      t.status === 'REFUNDED' || t.status === 'PARTIALLY_REFUNDED'
    );
  } else if (has_refund === 'false') {
    filtered = filtered.filter(t =>
      t.status !== 'REFUNDED' && t.status !== 'PARTIALLY_REFUNDED'
    );
  }
  if (search) {
    filtered = filtered.filter(t =>
      t.id.toLowerCase().includes(search) ||
      t.customerEmail?.toLowerCase().includes(search) ||
      t.customerPhone?.includes(search) ||
      t.gatewayOrderId?.toLowerCase().includes(search) ||
      t.gatewayPaymentId?.toLowerCase().includes(search) ||
      (t.metadata as Record<string, string>)?.orderId?.toLowerCase().includes(search)
    );
  }

  // Apply sort
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortDir   = sort.startsWith('-') ? -1 : 1;
  filtered.sort((a, b) => {
    const av = ((a as unknown) as Record<string, unknown>)[sortField] as string | number ?? '';
    const bv = ((b as unknown) as Record<string, unknown>)[sortField] as string | number ?? '';
    return av < bv ? -sortDir : av > bv ? sortDir : 0;
  });

  // Aggregate summary counts
  const summary = {
    total_amount:   filtered.reduce((sum, t) => sum + t.amount, 0),
    captured_count: filtered.filter(t => t.status === 'CAPTURED').length,
    failed_count:   filtered.filter(t => t.status === 'FAILED').length,
    pending_count:  filtered.filter(t => t.status === 'PENDING').length,
    refunded_count: filtered.filter(t =>
      t.status === 'REFUNDED' || t.status === 'PARTIALLY_REFUNDED'
    ).length,
  };

  // Paginate
  const total  = filtered.length;
  const pages  = Math.ceil(total / per_page);
  const offset = (page - 1) * per_page;
  const data   = filtered.slice(offset, offset + per_page);

  return NextResponse.json({
    success: true,
    data,
    summary,
    pagination: { page, per_page, total, pages },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
  });
}
