import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const meta = () => ({ request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() });

// ─── GET /api/v1/analytics/dashboard ─────────────────────────────────────────
// Returns aggregated KPIs for the main dashboard.
export async function GET() {
  try {
    const now   = new Date();
    const day30 = new Date(now.getTime() - 30 * 86400 * 1000);
    const day7  = new Date(now.getTime() -  7 * 86400 * 1000);

    const [
      totalTxns,
      capturedAgg,
      failedCount,
      pendingCount,
      refundedCount,
      recentTxns,
      pendingPayoutsAgg,
      disputeStats,
      chargebackStats,
      prevCapturedAgg,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where:  { status: 'CAPTURED' },
        _sum:   { amount: true },
        _count: true,
      }),
      prisma.transaction.count({ where: { status: 'FAILED' } }),
      prisma.transaction.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count({ where: { status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } }),
      prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.payout.aggregate({
        where: { status: { in: ['QUEUED', 'PROCESSING'] } },
        _sum:  { amount: true },
      }),
      prisma.dispute.groupBy({
        by:    ['status'],
        _count: true,
      }),
      prisma.chargeback.groupBy({
        by:    ['status'],
        _count: true,
      }),
      // Previous 30-day window for % change
      prisma.transaction.aggregate({
        where: { status: 'CAPTURED', createdAt: { gte: new Date(day30.getTime() - 30 * 86400 * 1000), lt: day30 } },
        _sum:  { amount: true },
      }),
    ]);

    const totalRevenue   = Number(capturedAgg._sum.amount ?? 0);
    const prevRevenue    = Number(prevCapturedAgg._sum.amount ?? 0);
    const revenueChange  = prevRevenue > 0 ? parseFloat(((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(2)) : null;
    const successRate    = totalTxns > 0 ? parseFloat(((capturedAgg._count / totalTxns) * 100).toFixed(1)) : 0;
    const pendingPayouts = Number(pendingPayoutsAgg._sum.amount ?? 0);

    const disputeMap     = Object.fromEntries(disputeStats.map((d) => [d.status, d._count]));
    const chargebackMap  = Object.fromEntries(chargebackStats.map((c) => [c.status, c._count]));

    // Transaction status distribution for chart
    const txnStatusData = await prisma.transaction.groupBy({ by: ['status'], _count: true });

    return NextResponse.json({
      success: true,
      data: {
        kpi: {
          totalRevenue,
          totalTransactions:   totalTxns,
          successRate,
          pendingPayouts,
          revenueChange,
          capturedCount:       capturedAgg._count,
          failedCount,
          pendingCount,
          refundedCount,
        },
        disputes: {
          total:       Object.values(disputeMap).reduce((a, b) => a + b, 0),
          pending:     disputeMap['PENDING']      ?? 0,
          under_review: disputeMap['UNDER_REVIEW'] ?? 0,
          resolved:    disputeMap['RESOLVED']     ?? 0,
        },
        chargebacks: {
          total:          Object.values(chargebackMap).reduce((a, b) => a + b, 0),
          pending:        chargebackMap['PENDING']   ?? 0,
          accepted:       chargebackMap['ACCEPTED']  ?? 0,
          rejected:       chargebackMap['REJECTED']  ?? 0,
          expired:        chargebackMap['EXPIRED']   ?? 0,
        },
        txnStatusDistribution: txnStatusData.map((d) => ({
          status: d.status,
          count:  d._count,
        })),
        recentTransactions: recentTxns.map((t) => ({ ...t, amount: Number(t.amount) })),
      },
      meta: meta(),
    });
  } catch (err) {
    console.error('[GET /analytics/dashboard]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
