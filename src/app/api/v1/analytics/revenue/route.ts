import { NextRequest, NextResponse } from 'next/server';
import { mockRevenueData } from '@/lib/mock-data';
import type { RevenueDataPoint } from '@/types';

type Period = '7d' | '30d' | '90d';

const PERIOD_DAYS: Record<Period, number> = {
  '7d':  7,
  '30d': 30,
  '90d': 90,
};

// Extend the 30-day seed into 90 days by duplicating with variance
function extend90Days(base: RevenueDataPoint[]): RevenueDataPoint[] {
  const result: RevenueDataPoint[] = [];
  for (let i = 0; i < 90; i++) {
    const seed     = base[i % base.length];
    const variance = 0.85 + Math.random() * 0.3; // ±15% noise
    const d = new Date('2026-01-15');
    d.setDate(d.getDate() + i);
    result.push({
      date:    d.toISOString().slice(0, 10),
      revenue: Math.round(seed.revenue * variance),
      payouts: Math.round(seed.payouts * variance),
    });
  }
  return result;
}

// ─── GET /api/v1/analytics/revenue ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const periodParam = (searchParams.get('period') ?? '30d') as Period;

  if (!['7d', '30d', '90d'].includes(periodParam)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_PERIOD',
          message: "period must be one of: '7d', '30d', '90d'",
        },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  const days = PERIOD_DAYS[periodParam];

  // Build the full dataset for the requested window
  const allData: RevenueDataPoint[] =
    days <= 30 ? mockRevenueData : extend90Days(mockRevenueData);

  const data = allData.slice(-days); // take the last N days

  // Aggregate totals
  const total_revenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const total_payouts = data.reduce((sum, d) => sum + d.payouts, 0);
  const net           = total_revenue - total_payouts;

  // Compare to the previous window for % change
  const prevWindow  = allData.slice(-(days * 2), -days);
  const prev_revenue = prevWindow.reduce((sum, d) => sum + d.revenue, 0);
  const revenue_change_pct = prev_revenue
    ? parseFloat((((total_revenue - prev_revenue) / prev_revenue) * 100).toFixed(2))
    : null;

  return NextResponse.json({
    success: true,
    data: {
      period:              periodParam,
      data_points:         data,
      total_revenue,
      total_payouts,
      net,
      revenue_change_pct,
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
  });
}
