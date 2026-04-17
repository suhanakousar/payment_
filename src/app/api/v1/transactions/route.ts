import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const meta = () => ({ request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() });

// ─── GET /api/v1/transactions ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page        = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
  const per_page    = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10)));
  const status      = searchParams.get('status')?.toUpperCase();
  const gateway     = searchParams.get('gateway')?.toUpperCase();
  const search      = searchParams.get('search')?.toLowerCase();
  const from        = searchParams.get('from');
  const to          = searchParams.get('to');
  const min_amount  = searchParams.get('min_amount') ? Number(searchParams.get('min_amount')) : null;
  const max_amount  = searchParams.get('max_amount') ? Number(searchParams.get('max_amount')) : null;
  const merchant_id = searchParams.get('merchant_id');
  const currency    = searchParams.get('currency')?.toUpperCase();
  const has_refund  = searchParams.get('has_refund');

  try {
    const where: Record<string, unknown> = {};

    if (status) {
      if (has_refund === 'true') {
        where.status = { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] };
      } else {
        where.status = status;
      }
    } else if (has_refund === 'true') {
      where.status = { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] };
    } else if (has_refund === 'false') {
      where.status = { notIn: ['REFUNDED', 'PARTIALLY_REFUNDED'] };
    }

    if (gateway)     where.gateway    = gateway;
    if (currency)    where.currency   = currency;
    if (merchant_id) where.merchantId = merchant_id;

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
        { customerPhone:    { contains: search } },
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

    const data = rows.map((t) => ({ ...t, amount: Number(t.amount) }));

    // Summary aggregates
    const [aggCaptured, aggFailed, aggPending, aggRefunded, aggTotal] = await Promise.all([
      prisma.transaction.aggregate({ where: { ...where, status: 'CAPTURED' }, _sum: { amount: true }, _count: true }),
      prisma.transaction.count({ where: { ...where, status: 'FAILED' } }),
      prisma.transaction.count({ where: { ...where, status: 'PENDING' } }),
      prisma.transaction.count({ where: { ...where, status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } }),
      prisma.transaction.aggregate({ where, _sum: { amount: true } }),
    ]);

    const summary = {
      total_amount:   Number(aggTotal._sum.amount ?? 0),
      captured_count: aggCaptured._count,
      failed_count:   aggFailed,
      pending_count:  aggPending,
      refunded_count: aggRefunded,
    };

    return NextResponse.json({
      success: true,
      data,
      summary,
      pagination: { page, per_page, total, pages: Math.ceil(total / per_page) },
      meta: meta(),
    });
  } catch (err) {
    console.error('[GET /transactions]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
