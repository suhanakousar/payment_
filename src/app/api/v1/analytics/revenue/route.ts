import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const meta = () => ({ request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() });

type Period = '7d' | '30d' | '90d';
const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const periodParam = (searchParams.get('period') ?? '30d') as Period;

  if (!['7d', '30d', '90d'].includes(periodParam)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PERIOD', message: "period must be one of: '7d', '30d', '90d'" }, meta: meta() },
      { status: 400 }
    );
  }

  const days = PERIOD_DAYS[periodParam];
  const now  = new Date();
  const from = new Date(now.getTime() - days * 86400 * 1000);
  const prevFrom = new Date(from.getTime() - days * 86400 * 1000);

  try {
    // Fetch all transactions and payouts in window + previous window
    const [transactions, payouts] = await Promise.all([
      prisma.transaction.findMany({
        where:  { createdAt: { gte: prevFrom }, status: { in: ['CAPTURED', 'REFUNDED', 'PARTIALLY_REFUNDED'] } },
        select: { amount: true, createdAt: true },
      }),
      prisma.payout.findMany({
        where:  { createdAt: { gte: prevFrom }, status: { in: ['SUCCESS', 'PROCESSING'] } },
        select: { amount: true, createdAt: true },
      }),
    ]);

    // Build daily buckets for the current window
    const buckets = new Map<string, { revenue: number; payouts: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 86400 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { revenue: 0, payouts: 0 });
    }

    for (const t of transactions) {
      const key = t.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.get(key)!.revenue += Number(t.amount);
      }
    }
    for (const p of payouts) {
      const key = p.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.get(key)!.payouts += Number(p.amount);
      }
    }

    const data_points = Array.from(buckets.entries()).map(([date, vals]) => ({ date, ...vals }));

    const total_revenue = data_points.reduce((s, d) => s + d.revenue, 0);
    const total_payouts = data_points.reduce((s, d) => s + d.payouts, 0);
    const net           = total_revenue - total_payouts;

    // Previous window totals for % change
    const prev_revenue = transactions
      .filter((t) => t.createdAt >= prevFrom && t.createdAt < from)
      .reduce((s, t) => s + Number(t.amount), 0);

    const revenue_change_pct = prev_revenue
      ? parseFloat((((total_revenue - prev_revenue) / prev_revenue) * 100).toFixed(2))
      : null;

    return NextResponse.json({
      success: true,
      data: { period: periodParam, data_points, total_revenue, total_payouts, net, revenue_change_pct },
      meta: meta(),
    });
  } catch (err) {
    console.error('[GET /analytics/revenue]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
