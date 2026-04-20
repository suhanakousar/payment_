'use client';

import { useState, useMemo } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { RealtimeIndicator } from '@/components/ui/realtime-indicator';
import Link from 'next/link';
import {
  DollarSign,
  ArrowLeftRight,
  CheckCircle,
  Clock,
  Download,
  Activity,
  TrendingUp,
  ExternalLink,
  CreditCard,
  AlertTriangle,
  ShieldAlert,
  XCircle,
  Gauge,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RecentActivity } from '@/types';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  CAPTURED:           '#22D3EE',
  FAILED:             '#F87171',
  PENDING:            '#FCD34D',
  REFUNDED:           '#A78BFA',
  AUTHORIZED:         '#34D399',
  PARTIALLY_REFUNDED: '#64748B',
};

const METHOD_COLORS: Record<string, string> = {
  upi:        '#22D3EE',
  card:       '#A78BFA',
  netbanking: '#34D399',
  wallet:     '#FCD34D',
};

const PERIOD_TABS = ['7D', '30D', '90D'] as const;
type Period = typeof PERIOD_TABS[number];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function RevenueTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl p-3 text-sm min-w-[160px]"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      }}
    >
      <p
        className="font-semibold mb-2 text-xs uppercase tracking-wide"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
            {entry.name === 'revenue' ? 'Revenue' : 'Payouts'}
          </span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MethodTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div
      className="rounded-xl p-3 text-sm"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      }}
    >
      <p className="font-semibold capitalize mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <p style={{ color: 'var(--text-secondary)' }}>
        <span className="font-semibold">{entry.value}%</span> of transactions
      </p>
    </div>
  );
}

function ActivityDot({ severity }: { severity?: RecentActivity['severity'] }) {
  const color =
    severity === 'success' ? '#34D399' :
    severity === 'warning' ? '#FCD34D' :
    severity === 'error'   ? '#F87171' :
                             '#22D3EE';
  return (
    <span
      className="mt-1 inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ background: color }}
    />
  );
}

function txnBadgeVariant(
  status: string
): 'success' | 'error' | 'warning' | 'info' | 'default' | 'pending' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default' | 'pending'> = {
    CAPTURED:           'success',
    AUTHORIZED:         'info',
    PENDING:            'pending',
    FAILED:             'error',
    REFUNDED:           'warning',
    PARTIALLY_REFUNDED: 'warning',
  };
  return map[status] ?? 'default';
}

interface DashboardApiData {
  kpi: {
    totalRevenue:      number;
    totalTransactions: number;
    successRate:       number;
    pendingPayouts:    number;
    revenueChange:     number | null;
    capturedCount:     number;
    failedCount:       number;
    pendingCount:      number;
    refundedCount:     number;
  };
  disputes:   { total: number; pending: number; under_review: number; resolved: number };
  chargebacks:{ total: number; pending: number; accepted: number; rejected: number; expired: number };
  txnStatusDistribution: { status: string; count: number }[];
  recentTransactions:    { id: string; amount: number; status: string; gateway: string; paymentMethod?: string; customerEmail: string | null; createdAt: string }[];
}

interface RevenuePoint { date: string; revenue: number; payouts: number; }

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState<Period>('30D');

  const { data: apiData, isRefreshing, lastUpdated, refresh } = useRealtimeData<DashboardApiData>(
    '/api/v1/analytics/dashboard',
    { interval: 10000 }
  );

  const revPeriod = activePeriod === '7D' ? '7d' : activePeriod === '30D' ? '30d' : '90d';
  const { data: revApiData } = useRealtimeData<{ data_points: RevenuePoint[] }>(
    `/api/v1/analytics/revenue?period=${revPeriod}`,
    { interval: 10000 }
  );
  const revenueData: RevenuePoint[] = revApiData?.data_points ?? [];

  useLiveEvents({
    onEvent: (event) => {
      if (event.type === 'transaction' || event.type === 'payout') {
        refresh();
      }
    },
  });

  const kpi = apiData?.kpi ?? {
    totalRevenue:      0,
    totalTransactions: 0,
    successRate:       0,
    pendingPayouts:    0,
    revenueChange:     null,
    capturedCount:     0,
    failedCount:       0,
    pendingCount:      0,
    refundedCount:     0,
  };

  const txnStatusDistribution = apiData?.txnStatusDistribution ?? [];
  const totalTxnCount = txnStatusDistribution.reduce((s, d) => s + d.count, 0) || 1;

  const disputeStats = useMemo(() => ({
    total:          apiData?.disputes.total          ?? 0,
    pending:        apiData?.disputes.pending        ?? 0,
    totalCb:        apiData?.chargebacks.total       ?? 0,
    pendingActions: apiData?.chargebacks.pending     ?? 0,
  }), [apiData]);

  const recentTxns = apiData?.recentTransactions ?? [];

  const chartData = revenueData;

  const formatXAxis = (value: string) => {
    const d = new Date(value);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };

  const methodChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    recentTxns.forEach((t) => {
      const m = (t as { paymentMethod?: string }).paymentMethod ?? 'other';
      counts[m] = (counts[m] || 0) + 1;
    });
    const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(counts).map(([method, count]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      percentage: Math.round((count / total) * 100),
      color: METHOD_COLORS[method] ?? '#64748B',
    }));
  }, [recentTxns]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-5 pb-4">

      {/* ── Welcome Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, #0D1B40 0%, #0C1733 40%, #14103A 80%, #130C30 100%)',
          border: '1px solid rgba(34,211,238,0.2)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(34,211,238,0.06)',
        }}
      >
        {/* Aurora blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-20 -left-20 w-72 h-72 rounded-full aurora-blob"
            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 65%)' }}
          />
          <div
            className="absolute -bottom-16 right-10 w-60 h-60 rounded-full aurora-blob"
            style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 65%)', animationDelay: '2s' }}
          />
          <div
            className="absolute top-0 right-0 w-96 h-full opacity-20"
            style={{
              background: 'repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(255,255,255,0.03) 28px, rgba(255,255,255,0.03) 29px)',
            }}
          />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RealtimeIndicator
                isRefreshing={isRefreshing}
                lastUpdated={lastUpdated}
              />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }} suppressHydrationWarning>
                {dateLabel}
              </span>
            </div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
              suppressHydrationWarning
            >
              {getGreeting()}, Merchant Admin
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Your payment platform overview — updated in real time
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className="hidden sm:flex flex-col items-center px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-xl font-extrabold tabular-nums gradient-text-cyan">{kpi.successRate}%</span>
              <span className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Success Rate</span>
            </div>
            <div
              className="hidden sm:flex flex-col items-center px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--text-primary)' }}>{kpi.totalTransactions.toLocaleString('en-IN')}</span>
              <span className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Txns</span>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl font-semibold text-sm px-4 py-2.5 transition-all btn-glow-cyan"
              style={{
                background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
                color: '#060C1A',
              }}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(kpi.totalRevenue)}
          change={kpi.revenueChange ?? undefined}
          icon={<DollarSign size={15} style={{ color: '#22D3EE' }} />}
          accentFrom="#22D3EE" accentTo="#A78BFA"
          glowColor="rgba(34,211,238,0.12)"
          className="animate-fade-in stagger-1 opacity-0"
        />
        <StatCard
          title="Total Transactions"
          value={kpi.totalTransactions.toLocaleString('en-IN')}
          icon={<ArrowLeftRight size={15} style={{ color: '#A78BFA' }} />}
          accentFrom="#A78BFA" accentTo="#22D3EE"
          glowColor="rgba(167,139,250,0.12)"
          className="animate-fade-in stagger-2 opacity-0"
        />
        <StatCard
          title="Success Rate"
          value={`${kpi.successRate}%`}
          icon={<CheckCircle size={15} style={{ color: '#34D399' }} />}
          accentFrom="#34D399" accentTo="#22D3EE"
          glowColor="rgba(52,211,153,0.12)"
          className="animate-fade-in stagger-3 opacity-0"
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(kpi.pendingPayouts)}
          icon={<Clock size={15} style={{ color: '#FCD34D' }} />}
          accentFrom="#FCD34D" accentTo="#F87171"
          glowColor="rgba(252,211,77,0.10)"
          className="animate-fade-in stagger-4 opacity-0"
        />
      </div>

      {/* ── Dispute & Chargeback Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            href: '/dashboard/disputes',
            label: 'Total Disputes',
            value: disputeStats.total,
            sub: 'All dispute cases',
            Icon: AlertTriangle,
            color: '#FCD34D',
            bg: 'rgba(252,211,77,0.08)',
            border: 'rgba(252,211,77,0.2)',
          },
          {
            href: '/dashboard/disputes?status=PENDING',
            label: 'Pending Disputes',
            value: disputeStats.pending,
            sub: 'Awaiting review',
            Icon: AlertTriangle,
            color: '#F87171',
            bg: 'rgba(248,113,113,0.08)',
            border: 'rgba(248,113,113,0.2)',
          },
          {
            href: '/dashboard/chargebacks',
            label: 'Total Chargebacks',
            value: disputeStats.totalCb,
            sub: 'All chargeback cases',
            Icon: ShieldAlert,
            color: '#F87171',
            bg: 'rgba(248,113,113,0.08)',
            border: 'rgba(248,113,113,0.2)',
          },
          {
            href: '/dashboard/chargebacks?status=PENDING',
            label: 'Pending Actions',
            value: disputeStats.pendingActions,
            sub: 'Require decision',
            Icon: ShieldAlert,
            color: '#A78BFA',
            bg: 'rgba(167,139,250,0.08)',
            border: 'rgba(167,139,250,0.2)',
          },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="block group">
            <div
              className="rounded-2xl p-4 transition-all duration-200 group-hover:scale-[1.02]"
              style={{
                background: item.bg,
                border: `1px solid ${item.border}`,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: item.color }}
                >
                  {item.label}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}20`, border: `1px solid ${item.color}30` }}
                >
                  <item.Icon size={14} style={{ color: item.color }} />
                </div>
              </div>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {item.value}
              </p>
              <p className="text-[11px] mt-1" style={{ color: item.color + 'aa' }}>
                {item.sub}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Area Chart */}
        <Card className="lg:col-span-2 animate-fade-in stagger-1 opacity-0">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={15} style={{ color: 'var(--primary)' }} />
                  Revenue Overview
                </CardTitle>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Revenue vs Payouts over time
                </p>
              </div>
              <div
                className="flex items-center gap-0.5 rounded-xl p-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
              >
                {PERIOD_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePeriod(tab)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: activePeriod === tab ? 'var(--primary)' : 'transparent',
                      color: activePeriod === tab ? '#060C1A' : 'var(--text-secondary)',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22D3EE" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="payoutsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#A78BFA" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.01} />
                </linearGradient>
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 11, fill: '#4A5568' }}
                  tickLine={false}
                  axisLine={false}
                  interval={activePeriod === '7D' ? 0 : activePeriod === '30D' ? 4 : 12}
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  tick={{ fontSize: 11, fill: '#4A5568' }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#22D3EE', stroke: '#060C1A', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="payouts"
                  stroke="#A78BFA"
                  strokeWidth={2}
                  fill="url(#payoutsGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#A78BFA', stroke: '#060C1A', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-block w-3 h-0.5 rounded-full bg-cyan-400" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-block w-3 h-0.5 rounded-full bg-violet-400" />
                Payouts
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Status Donut */}
        <Card className="animate-fade-in stagger-2 opacity-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={15} style={{ color: 'var(--primary)' }} />
              Transaction Distribution
            </CardTitle>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>By status breakdown</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={txnStatusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {txnStatusDistribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_CHART_COLORS[entry.status] ?? '#2D3748'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [(value as number).toLocaleString('en-IN'), '']}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: '#0D1526',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                      fontSize: 12,
                      color: '#F0F4FF',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {totalTxnCount.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>total</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {txnStatusDistribution.map((entry) => {
                const pct = ((entry.count / totalTxnCount) * 100).toFixed(1);
                return (
                  <div key={entry.status} className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: STATUS_CHART_COLORS[entry.status] ?? '#2D3748' }}
                    />
                    <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {entry.status.replace('_', ' ')}
                    </span>
                    <span className="ml-auto text-[11px] font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Payment Methods Bar Chart */}
        <Card className="animate-fade-in stagger-1 opacity-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={15} style={{ color: 'var(--primary)' }} />
              Payment Methods
            </CardTitle>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Transaction share by method</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={methodChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#4A5568' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#4A5568' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 55]}
                />
                <Tooltip content={<MethodTooltip />} />
                <Bar
                  dataKey="percentage"
                  radius={[6, 6, 0, 0]}
                  label={{ position: 'top', fontSize: 11, fill: '#4A5568', formatter: (v: unknown) => `${v}%` }}
                >
                  {methodChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-2">
              {methodChartData.map((m) => (
                <span
                  key={m.name}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.color }} />
                  {m.name}: {m.percentage}%
                </span>
              ))}
              {methodChartData.length === 0 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No transaction data yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Performance */}
        <Card className="animate-fade-in stagger-2 opacity-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge size={15} style={{ color: 'var(--primary)' }} />
              System Performance
            </CardTitle>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Live processing metrics</p>
          </CardHeader>
          <CardContent className="pt-3 space-y-3">
            {/* Success Rate */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: '#34D399' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    System Success Rate
                  </span>
                </div>
                <Badge variant="success" size="sm" dot>Live</Badge>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Success Rate</span>
                  <span className="text-sm font-extrabold" style={{ color: '#34D399' }}>
                    {kpi.successRate}%
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(52,211,153,0.15)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${kpi.successRate}%`,
                      background: 'linear-gradient(90deg, #34D399, #22D3EE)',
                    }}
                  />
                </div>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Last updated: just now
              </p>
            </div>

            {/* Failed Transactions */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle size={14} style={{ color: '#F87171' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Failed Transactions
                  </span>
                </div>
                <span className="text-xl font-extrabold" style={{ color: '#F87171' }}>
                  {kpi.failedCount}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>This period</p>
            </div>

            {/* Avg Processing Time */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(34,211,238,0.06)',
                border: '1px solid rgba(34,211,238,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} style={{ color: '#22D3EE' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Avg Processing Time
                  </span>
                </div>
                <span className="text-xl font-extrabold" style={{ color: '#22D3EE' }}>
                  850ms
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Average per transaction</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Transactions */}
        <Card className="animate-fade-in stagger-1 opacity-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight size={15} style={{ color: 'var(--primary)' }} />
                  Recent Transactions
                </CardTitle>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest 5 payment events</p>
              </div>
              <Link
                href="/dashboard/transactions"
                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                View All <ExternalLink size={10} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Amount', 'Status', 'Method', 'Date'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-bold uppercase tracking-wide px-5 py-3 first:pl-6 last:pr-6"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map((txn, idx) => (
                    <tr
                      key={txn.id}
                      className="table-row-dark"
                      style={{ borderBottom: idx !== recentTxns.length - 1 ? '1px solid rgba(255,255,255,0.03)' : undefined }}
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs font-medium" style={{ color: 'var(--primary)' }}>
                          {txn.id.slice(0, 13)}&hellip;
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={txnBadgeVariant(txn.status)} size="sm" dot>
                          {txn.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {txn.paymentMethod ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          {formatRelativeTime(txn.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Showing 5 of {kpi.totalTransactions || recentTxns.length} transactions
              </span>
              <Link
                href="/dashboard/transactions"
                className="text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                View all <ExternalLink size={10} />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="animate-fade-in stagger-2 opacity-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={15} style={{ color: 'var(--primary)' }} />
              Recent Activity
            </CardTitle>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Platform events &amp; alerts</p>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-0">
              {recentTxns.length === 0 && (
                <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
              )}
              {recentTxns.map((txn, idx) => {
                const severity: RecentActivity['severity'] =
                  txn.status === 'CAPTURED'   ? 'success' :
                  txn.status === 'FAILED'     ? 'error'   :
                  txn.status === 'PENDING'    ? 'warning' : 'info';
                const msg = `Payment of ${formatCurrency(txn.amount)} ${txn.status.toLowerCase()} via ${txn.gateway}${txn.customerEmail ? ` — ${txn.customerEmail}` : ''}`;
                return (
                  <div key={txn.id} className="relative flex gap-3">
                    {idx !== recentTxns.length - 1 && (
                      <span className="absolute left-[4.5px] top-5 bottom-0 w-px" style={{ background: 'var(--border)' }} />
                    )}
                    <ActivityDot severity={severity} />
                    <div className="flex-1 pb-4 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{msg}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {formatRelativeTime(txn.createdAt)}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
                          style={{ background: 'rgba(34,211,238,0.12)', color: '#22D3EE' }}
                        >
                          payment
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
