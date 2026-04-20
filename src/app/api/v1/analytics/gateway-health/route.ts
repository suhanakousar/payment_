import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ─── GET /api/v1/analytics/gateway-health ────────────────────────────────────
// Computes real gateway health from actual transaction data.
export async function GET() {
  const now      = new Date();
  const since24h = new Date(now.getTime() - 24 * 3600  * 1000);
  const since7d  = new Date(now.getTime() - 7  * 86400 * 1000);

  try {
    const [txns24h, txns7d] = await Promise.all([
      prisma.transaction.groupBy({ by: ['gateway', 'status'], _count: true, where: { createdAt: { gte: since24h } } }),
      prisma.transaction.groupBy({ by: ['gateway', 'status'], _count: true, where: { createdAt: { gte: since7d  } } }),
    ]);

    const buckets: Record<string, { h24: Record<string, number>; d7: Record<string, number> }> = {};

    for (const row of txns24h) {
      if (!buckets[row.gateway]) buckets[row.gateway] = { h24: {}, d7: {} };
      buckets[row.gateway].h24[row.status] = (buckets[row.gateway].h24[row.status] ?? 0) + row._count;
    }
    for (const row of txns7d) {
      if (!buckets[row.gateway]) buckets[row.gateway] = { h24: {}, d7: {} };
      buckets[row.gateway].d7[row.status] = (buckets[row.gateway].d7[row.status] ?? 0) + row._count;
    }

    // Ensure CASHFREE always appears (since we've configured it)
    if (!buckets['CASHFREE']) buckets['CASHFREE'] = { h24: {}, d7: {} };

    const gateways = Object.entries(buckets).map(([gateway, data]) => {
      const total24h    = Object.values(data.h24).reduce((a, b) => a + b, 0);
      const captured24h = data.h24['CAPTURED'] ?? 0;
      const failed24h   = data.h24['FAILED']   ?? 0;
      const successRate = total24h > 0 ? parseFloat(((captured24h / total24h) * 100).toFixed(1)) : 100;

      const total7d    = Object.values(data.d7).reduce((a, b) => a + b, 0);
      const captured7d = data.d7['CAPTURED'] ?? 0;
      const uptime7d   = total7d > 0 ? parseFloat(((captured7d / total7d) * 100).toFixed(2)) : 99.9;

      let status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' = 'OPERATIONAL';
      if      (total24h > 0 && successRate < 80)  status = 'DOWN';
      else if (total24h > 0 && successRate < 95)  status = 'DEGRADED';

      return {
        gateway,
        status,
        success_rate:  successRate,
        total_24h:     total24h,
        captured_24h:  captured24h,
        failed_24h:    failed24h,
        uptime_7d:     uptime7d,
        incidents_24h: failed24h,
        last_checked:  now.toISOString(),
        region:        'ap-south-1',
      };
    });

    const operational = gateways.filter((g) => g.status === 'OPERATIONAL').length;
    const degraded    = gateways.filter((g) => g.status === 'DEGRADED').length;
    const down        = gateways.filter((g) => g.status === 'DOWN').length;

    return NextResponse.json({
      success: true,
      data: {
        gateways,
        summary: {
          total: gateways.length, operational, degraded, down,
          overall_status: down > 0 ? 'PARTIAL_OUTAGE' : degraded > 0 ? 'DEGRADED' : 'OPERATIONAL',
        },
      },
      meta: { request_id: `req_${Date.now()}`, timestamp: now.toISOString() },
    });
  } catch (err) {
    console.error('[gateway-health]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
