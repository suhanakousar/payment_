import { NextResponse } from 'next/server';

// Process start time — approximated since this is a mock
const PROCESS_START = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);

// ─── GET /api/health ──────────────────────────────────────────────────────────
export async function GET() {
  const now       = Date.now();
  const uptimeSec = Math.floor((now - PROCESS_START) / 1000);

  // Mock sub-system pings
  const database_ping: number = Math.floor(2 + Math.random() * 8);   // 2–10 ms
  const redis_ping:    number = Math.floor(1 + Math.random() * 4);   // 1–5  ms
  const queue_depth:   number = Math.floor(Math.random() * 50);      // 0–49 jobs

  // Gateway summary (mirrors gateway-health but condensed)
  const gateway_health = [
    { gateway: 'RAZORPAY',  status: 'OPERATIONAL', success_rate: 98.7 },
    { gateway: 'CASHFREE',  status: 'OPERATIONAL', success_rate: 97.4 },
    { gateway: 'STRIPE',    status: 'DEGRADED',    success_rate: 91.2 },
    { gateway: 'PAYU',      status: 'OPERATIONAL', success_rate: 96.8 },
    { gateway: 'PAYTM',     status: 'MAINTENANCE', success_rate: 0    },
  ];

  const allOperational =
    gateway_health.every(g => g.status === 'OPERATIONAL' || g.status === 'MAINTENANCE');

  const overallStatus =
    database_ping > 50 || redis_ping > 50
      ? 'UNHEALTHY'
      : gateway_health.some(g => g.status === 'DOWN')
      ? 'DEGRADED'
      : gateway_health.some(g => g.status === 'DEGRADED')
      ? 'DEGRADED'
      : 'HEALTHY';

  const uptimeStr = (() => {
    const d = Math.floor(uptimeSec / 86400);
    const h = Math.floor((uptimeSec % 86400) / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = uptimeSec % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  })();

  return NextResponse.json({
    success: true,
    data: {
      status:        overallStatus,
      version:       '1.0.0',
      environment:   process.env.NODE_ENV ?? 'development',
      uptime_seconds: uptimeSec,
      uptime:        uptimeStr,
      checks: {
        database: {
          status:    database_ping < 50 ? 'OK' : 'SLOW',
          latency_ms: database_ping,
          provider:  'PostgreSQL',
        },
        redis: {
          status:    redis_ping < 20 ? 'OK' : 'SLOW',
          latency_ms: redis_ping,
          provider:  'Redis',
        },
        queue: {
          status:      queue_depth < 100 ? 'OK' : 'BACKLOGGED',
          depth:       queue_depth,
          provider:    'BullMQ',
        },
        gateways: {
          status:  allOperational ? 'OK' : 'PARTIAL',
          summary: gateway_health,
        },
      },
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() },
  });
}
