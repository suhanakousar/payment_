'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Download,
  BarChart3,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Users,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import {
  mockRevenueData,
  mockPaymentMethodBreakdown,
  mockGatewayHealth,
} from '@/lib/mock-data';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Period = 'Today' | '7 Days' | '30 Days' | '90 Days' | 'Custom';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & generated mock data
// ─────────────────────────────────────────────────────────────────────────────

const PERIODS: Period[] = ['Today', '7 Days', '30 Days', '90 Days', 'Custom'];

const INDIGO = '#6366F1';
const VIOLET = '#8B5CF6';
const TEAL = '#14B8A6';
const AMBER = '#F59E0B';
const ROSE = '#F43F5E';
const SLATE = '#CBD5E1';

// Revenue chart data — derived from mockRevenueData, adding txnCount & movingAvg
const revenueChartData = mockRevenueData.map((d, i, arr) => {
  const windowSize = 5;
  const start = Math.max(0, i - windowSize + 1);
  const slice = arr.slice(start, i + 1);
  const movingAvg = Math.round(slice.reduce((s, x) => s + x.revenue, 0) / slice.length);
  return {
    date: d.date.slice(5), // "MM-DD"
    revenue: Math.round(d.revenue / 100),
    movingAvg: Math.round(movingAvg / 100),
    txnCount: Math.floor(30 + Math.random() * 60),
  };
});

// 30-day stacked status data
function seeded(seed: number, min: number, max: number) {
  const x = Math.sin(seed) * 10000;
  return Math.floor(min + (x - Math.floor(x)) * (max - min));
}

const stackedStatusData = Array.from({ length: 30 }, (_, i) => {
  const base = new Date('2026-03-16');
  base.setDate(base.getDate() + i);
  return {
    date: base.toISOString().slice(5, 10),
    success: seeded(i * 3 + 1, 30, 60),
    failed: seeded(i * 3 + 2, 2, 8),
    pending: seeded(i * 3 + 3, 1, 5),
  };
});

// Heatmap data: 7 rows (days) x 24 cols (hours)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const heatmapData = DAYS.map((day, di) =>
  Array.from({ length: 24 }, (_, hi) => ({
    day,
    hour: hi,
    value: seeded(di * 24 + hi + 100, 0, 100),
  }))
);

// Gateway performance — enriched from mockGatewayHealth
const gatewayPerfData = mockGatewayHealth.map((g) => ({
  name: g.gateway.charAt(0) + g.gateway.slice(1).toLowerCase(),
  successRate: g.successRate,
  avgLatency: g.avgLatency,
}));

const gatewayTableData = [
  { name: 'Razorpay', total: 4821, successRate: 98.5, avgLatency: 312, uptime: '99.97%' },
  { name: 'Cashfree', total: 3104, successRate: 97.2, avgLatency: 278, uptime: '99.91%' },
  { name: 'Stripe', total: 1322, successRate: 89.1, avgLatency: 890, uptime: '98.42%' },
];

// Payment method pie data
const pieData = mockPaymentMethodBreakdown.map((m) => ({
  name: m.method.charAt(0).toUpperCase() + m.method.slice(1),
  value: m.count,
  amount: m.amount,
  percentage: m.percentage,
}));
const PIE_COLORS = [INDIGO, VIOLET, TEAL, AMBER];

// Top customers
const topCustomers = [
  { rank: 1, email: 'priya.mehta@gmail.com', spent: 1_89_34_500, txnCount: 47, lastTxn: '2026-04-14' },
  { rank: 2, email: 'rajan.pillai@gmail.com', spent: 1_54_21_200, txnCount: 38, lastTxn: '2026-04-13' },
  { rank: 3, email: 'aditya.kumar@gmail.com', spent: 1_23_87_900, txnCount: 31, lastTxn: '2026-04-14' },
  { rank: 4, email: 'kavitha.nair@hotmail.com', spent: 98_43_100, txnCount: 24, lastTxn: '2026-04-12' },
  { rank: 5, email: 'sunita.rao@yahoo.co.in', spent: 76_19_500, txnCount: 18, lastTxn: '2026-04-11' },
];

// Failure reasons donut
const failureData = [
  { name: 'Insufficient Funds', value: 35, color: '#F43F5E' },
  { name: 'Bank Timeout', value: 25, color: '#FB7185' },
  { name: '3DS Auth Failed', value: 20, color: '#FDA4AF' },
  { name: 'Card Expired', value: 12, color: '#FECDD3' },
  { name: 'Other', value: 8, color: '#FFE4E6' },
];
const TOTAL_FAILURES = 1247;

// ─────────────────────────────────────────────────────────────────────────────
// KPI mini cards data
// ─────────────────────────────────────────────────────────────────────────────

const kpiData = [
  {
    label: 'Gross Volume',
    value: '₹24,89,450',
    icon: DollarSign,
    trend: '+12.5%',
    up: true,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  {
    label: 'Net Revenue',
    value: '₹23,65,000',
    icon: TrendingUp,
    trend: '+9.8%',
    up: true,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Refund Rate',
    value: '2.3%',
    icon: ArrowDownRight,
    trend: '-0.4%',
    up: false,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
  },
  {
    label: 'Avg Txn Value',
    value: '₹1,997',
    icon: CreditCard,
    trend: '+3.2%',
    up: true,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    label: 'Payout Volume',
    value: '₹12,34,000',
    icon: ArrowUpRight,
    trend: '+7.1%',
    up: true,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Settlement Pending',
    value: '₹3,21,000',
    icon: Clock,
    trend: '+1.3%',
    up: false,
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-500',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltips
// ─────────────────────────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs space-y-1.5 min-w-[180px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}</span>
          </span>
          <span className="font-medium text-slate-800">
            {p.dataKey === 'txnCount' ? p.value : `₹${p.value.toLocaleString('en-IN')}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function StackedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + p.value, 0);
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs space-y-1.5 min-w-[170px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: p.fill }} />
            <span className="text-slate-500 capitalize">{p.dataKey}</span>
          </span>
          <span className="font-medium text-slate-800">{p.value}</span>
        </div>
      ))}
      <div className="border-t border-slate-100 pt-1.5 flex justify-between font-semibold text-slate-700">
        <span>Total</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

function GatewayTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs space-y-1.5 min-w-[170px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: p.fill }} />
            <span className="text-slate-500">{p.name}</span>
          </span>
          <span className="font-medium text-slate-800">
            {p.dataKey === 'successRate' ? `${p.value}%` : `${p.value}ms`}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-1">{d.name}</p>
      <p className="text-slate-500">Count: <span className="font-medium text-slate-800">{d.value.toLocaleString('en-IN')}</span></p>
      <p className="text-slate-500">Share: <span className="font-medium text-slate-800">{d.payload.percentage}%</span></p>
      <p className="text-slate-500">Amount: <span className="font-medium text-slate-800">{formatCurrency(d.payload.amount)}</span></p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap cell intensity → indigo shade
// ─────────────────────────────────────────────────────────────────────────────

function intensityToColor(value: number): string {
  // 0-100 → light to dark indigo
  const opacity = 0.08 + (value / 100) * 0.85;
  return `rgba(99,102,241,${opacity.toFixed(2)})`;
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({ item }: { item: typeof kpiData[0] }) {
  const Icon = item.icon;
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2.5 rounded-xl', item.iconBg)}>
            <Icon size={18} className={item.iconColor} />
          </div>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              item.up
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-500'
            )}
          >
            {item.trend}
          </span>
        </div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
          {item.value}
        </p>
        <p className="text-xs text-slate-500 font-medium">{item.label}</p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [activePeriod, setActivePeriod] = useState<Period>('30 Days');
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [heatmapHover, setHeatmapHover] = useState<{ day: string; hour: number; value: number } | null>(null);

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-indigo-500" />
            Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Deep dive into your payment performance</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center bg-slate-100 rounded-full p-1 gap-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  activePeriod === p
                    ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {p === 'Custom' ? (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Custom
                  </span>
                ) : (
                  p
                )}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
          >
            Download Report
          </Button>
        </div>
      </div>

      {/* ── KPI Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((item) => (
          <KpiCard key={item.label} item={item} />
        ))}
      </div>

      {/* ── Revenue Trend ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Trend</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Last 30 days · Indigo = Revenue · Dashed amber = Moving avg · Grey bars = Txn count</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <TrendingUp size={12} />
              +12.5% vs prev period
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={revenueChartData} margin={{ top: 10, right: 50, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INDIGO} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={INDIGO} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                width={52}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
              />
              <Bar
                yAxisId="right"
                dataKey="txnCount"
                name="Txn Count"
                fill={SLATE}
                fillOpacity={0.4}
                radius={[2, 2, 0, 0]}
                barSize={8}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue (₹)"
                stroke={INDIGO}
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 5, fill: INDIGO, strokeWidth: 2, stroke: '#fff' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="movingAvg"
                name="Moving Avg"
                stroke={AMBER}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, fill: AMBER }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Two Column: Pie + Gateway ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">By transaction count · hover to explore</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  onMouseEnter={(_, idx) => setActivePieIndex(idx)}
                  onMouseLeave={() => setActivePieIndex(null)}
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {pieData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      opacity={activePieIndex === null || activePieIndex === idx ? 1 : 0.6}
                      style={{
                        transform: activePieIndex === idx ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Method table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-1 text-slate-400 font-medium">Method</th>
                    <th className="text-right py-2 px-1 text-slate-400 font-medium">Count</th>
                    <th className="text-right py-2 px-1 text-slate-400 font-medium">Amount</th>
                    <th className="text-right py-2 px-1 text-slate-400 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPaymentMethodBreakdown.map((m, idx) => (
                    <tr
                      key={m.method}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 px-1">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          <span className="capitalize font-medium text-slate-700">{m.method}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-1 text-right text-slate-600">{m.count.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-1 text-right text-slate-600">{formatCurrency(m.amount)}</td>
                      <td className="py-2.5 px-1 text-right">
                        <span className="font-semibold text-slate-800">{m.percentage}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Gateway Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Gateway Performance Comparison</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Success rate (%) vs Avg latency (ms)</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={gatewayPerfData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
                <Tooltip content={<GatewayTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar
                  dataKey="successRate"
                  name="Success Rate %"
                  fill={INDIGO}
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
                <Bar
                  dataKey="avgLatency"
                  name="Avg Latency ms"
                  fill={AMBER}
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Gateway summary table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-1 text-slate-400 font-medium">Gateway</th>
                    <th className="text-right py-2 px-1 text-slate-400 font-medium">Txns</th>
                    <th className="text-right py-2 px-1 text-slate-400 font-medium">Success</th>
                    <th className="text-right py-2 px-1 text-slate-400 font-medium">Latency</th>
                    <th className="text-right py-2 px-1 text-slate-400 font-medium">Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {gatewayTableData.map((g) => (
                    <tr key={g.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-1 font-medium text-slate-700">{g.name}</td>
                      <td className="py-2.5 px-1 text-right text-slate-600">{g.total.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-1 text-right">
                        <span className={cn(
                          'font-semibold',
                          g.successRate >= 97 ? 'text-emerald-600' : g.successRate >= 93 ? 'text-amber-600' : 'text-rose-500'
                        )}>
                          {g.successRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-1 text-right text-slate-600">{g.avgLatency}ms</td>
                      <td className="py-2.5 px-1 text-right text-slate-600">{g.uptime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Transaction Volume by Status ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume by Status</CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">Stacked composition of outcomes over 30 days</p>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stackedStatusData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TEAL} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={TEAL} stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ROSE} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={ROSE} stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AMBER} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={AMBER} stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<StackedTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Area
                type="monotone"
                dataKey="success"
                name="Success"
                stackId="1"
                stroke={TEAL}
                strokeWidth={1.5}
                fill="url(#successGrad)"
              />
              <Area
                type="monotone"
                dataKey="failed"
                name="Failed"
                stackId="1"
                stroke={ROSE}
                strokeWidth={1.5}
                fill="url(#failedGrad)"
              />
              <Area
                type="monotone"
                dataKey="pending"
                name="Pending"
                stackId="1"
                stroke={AMBER}
                strokeWidth={1.5}
                fill="url(#pendingGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Hourly Heatmap ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Volume by Hour</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Hover cells to see exact count · Darker = higher volume</p>
            </div>
            {heatmapHover && (
              <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-3 py-1.5 rounded-full border border-indigo-100 transition-all">
                {heatmapHover.day} {formatHour(heatmapHover.hour)}: {heatmapHover.value} transactions
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Hour labels */}
            <div className="flex ml-10 mb-1.5">
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="flex-1 text-center text-[9px] text-slate-400 font-medium"
                  style={{ minWidth: '2rem' }}
                >
                  {h % 3 === 0 ? formatHour(h) : ''}
                </div>
              ))}
            </div>

            {/* Rows */}
            {heatmapData.map((row) => (
              <div key={row[0].day} className="flex items-center mb-1">
                <span className="w-10 text-xs text-slate-500 font-medium shrink-0">{row[0].day}</span>
                <div className="flex flex-1 gap-0.5">
                  {row.map((cell) => (
                    <div
                      key={cell.hour}
                      className="flex-1 h-7 rounded-sm cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-indigo-300 hover:ring-offset-1"
                      style={{
                        background: intensityToColor(cell.value),
                        minWidth: '1.75rem',
                      }}
                      onMouseEnter={() => setHeatmapHover({ day: cell.day, hour: cell.hour, value: cell.value })}
                      onMouseLeave={() => setHeatmapHover(null)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 ml-10">
              <span className="text-[10px] text-slate-400">Low</span>
              <div className="flex gap-0.5">
                {[0, 20, 40, 60, 80, 100].map((v) => (
                  <div
                    key={v}
                    className="w-5 h-3 rounded-sm"
                    style={{ background: intensityToColor(v) }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400">High</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bottom Two Columns ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              <CardTitle>Top Customers</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">By total spend this period</p>
          </CardHeader>
          <CardContent className="pt-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-1 text-slate-400 font-medium">#</th>
                  <th className="text-left py-2 px-1 text-slate-400 font-medium">Customer</th>
                  <th className="text-right py-2 px-1 text-slate-400 font-medium">Total Spent</th>
                  <th className="text-right py-2 px-1 text-slate-400 font-medium">Txns</th>
                  <th className="text-right py-2 px-1 text-slate-400 font-medium">Last Txn</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr key={c.rank} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-1">
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold',
                          c.rank === 1
                            ? 'bg-amber-100 text-amber-700'
                            : c.rank === 2
                            ? 'bg-slate-200 text-slate-600'
                            : c.rank === 3
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {c.rank}
                      </span>
                    </td>
                    <td className="py-3 px-1 font-medium text-slate-700 max-w-[140px] truncate">
                      {c.email}
                    </td>
                    <td className="py-3 px-1 text-right font-semibold text-slate-800">
                      {formatCurrency(c.spent)}
                    </td>
                    <td className="py-3 px-1 text-right text-slate-600">{c.txnCount}</td>
                    <td className="py-3 px-1 text-right text-slate-400">{c.lastTxn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Failed Transaction Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-500" />
              <CardTitle>Failed Transaction Analysis</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Breakdown of {TOTAL_FAILURES.toLocaleString('en-IN')} failed transactions</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* Donut chart */}
              <div className="shrink-0">
                <ResponsiveContainer width={200} height={180}>
                  <PieChart>
                    <Pie
                      data={failureData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={85}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {failureData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Share']}
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 10,
                        border: '1px solid #F1F5F9',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Failure list */}
              <div className="flex-1 space-y-2.5 w-full">
                {failureData.map((f) => {
                  const count = Math.round((f.value / 100) * TOTAL_FAILURES);
                  return (
                    <div key={f.name} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: f.color }}
                          />
                          {f.name}
                        </span>
                        <span className="text-xs text-slate-500">{count} · <span className="font-semibold text-slate-700">{f.value}%</span></span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${f.value}%`,
                            background: f.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
