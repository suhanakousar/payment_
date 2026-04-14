import { NextResponse } from 'next/server';

interface GatewayHealthEntry {
  gateway:       string;
  status:        'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE';
  success_rate:  number;   // percentage 0–100
  avg_latency:   number;   // milliseconds
  p99_latency:   number;   // milliseconds
  last_checked:  string;   // ISO timestamp
  uptime_7d:     number;   // percentage
  incidents_24h: number;
  region:        string;
}

// ─── GET /api/v1/analytics/gateway-health ────────────────────────────────────
export async function GET() {
  const now = new Date().toISOString();

  const gatewayHealth: GatewayHealthEntry[] = [
    {
      gateway:       'RAZORPAY',
      status:        'OPERATIONAL',
      success_rate:  98.7,
      avg_latency:   210,
      p99_latency:   820,
      last_checked:  now,
      uptime_7d:     99.95,
      incidents_24h: 0,
      region:        'ap-south-1',
    },
    {
      gateway:       'CASHFREE',
      status:        'OPERATIONAL',
      success_rate:  97.4,
      avg_latency:   185,
      p99_latency:   710,
      last_checked:  now,
      uptime_7d:     99.80,
      incidents_24h: 1,
      region:        'ap-south-1',
    },
    {
      gateway:       'STRIPE',
      status:        'DEGRADED',
      success_rate:  91.2,
      avg_latency:   540,
      p99_latency:   2100,
      last_checked:  now,
      uptime_7d:     99.10,
      incidents_24h: 3,
      region:        'us-east-1',
    },
    {
      gateway:       'PAYU',
      status:        'OPERATIONAL',
      success_rate:  96.8,
      avg_latency:   230,
      p99_latency:   910,
      last_checked:  now,
      uptime_7d:     99.60,
      incidents_24h: 0,
      region:        'ap-south-1',
    },
    {
      gateway:       'PAYTM',
      status:        'MAINTENANCE',
      success_rate:  0,
      avg_latency:   0,
      p99_latency:   0,
      last_checked:  now,
      uptime_7d:     97.50,
      incidents_24h: 1,
      region:        'ap-south-1',
    },
  ];

  // Summary stats
  const operational = gatewayHealth.filter(g => g.status === 'OPERATIONAL').length;
  const degraded    = gatewayHealth.filter(g => g.status === 'DEGRADED').length;
  const down        = gatewayHealth.filter(g => g.status === 'DOWN').length;

  return NextResponse.json({
    success: true,
    data: {
      gateways: gatewayHealth,
      summary: {
        total:       gatewayHealth.length,
        operational,
        degraded,
        down,
        maintenance: gatewayHealth.filter(g => g.status === 'MAINTENANCE').length,
        overall_status: down > 0 ? 'PARTIAL_OUTAGE' : degraded > 0 ? 'DEGRADED' : 'OPERATIONAL',
      },
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: now },
  });
}
