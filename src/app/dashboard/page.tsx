'use client';

import { useState, useMemo } from 'react';
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
  Zap,
  CreditCard,
  RefreshCw,
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

import {
  mockDashboardKPI,
  mockRevenueData,
  mockTransactions,
  mockGatewayHealth,
  mockPaymentMethodBreakdown,
  mockTransactionStatusData,
  mockRecentActivity,
} from '@/lib/mock-data';
import {
  cn,
  formatCurrency,
  formatRelativeTime,
} from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RecentActivity, GatewayHealth } from '@/types';

// ─── Local types ─────────────────────────────────────────────────────────────

// Minimal Recharts custom tooltip prop shape (avoids complex generic resolution)
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CHART_COLORS: Record<string, string> = {
  CAPTURED:           '#14B8A6',
  FAILED:             '#F43F5E',
  PENDING:            '#F59E0B',
  REFUNDED:           '#6366F1',
  AUTHORIZED:         '#8B5CF6',
  PARTIALLY_REFUNDED: '#94A3B8',
};

const METHOD_COLORS: Record<string, string> = {
  upi:        '#6366F1',
  card:       '#8B5CF6',
  netbanking: '#14B8A6',
  wallet:     '#F59E0B',
};

const PERIOD_TABS = ['7D', '30D', '90D'] as const;
type Period = typeof PERIOD_TABS[number];

// ─────────────────────────────────────────────────────────────────────────────
// Greeting helper
// ─────────────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Recharts Tooltip – Revenue Chart
// ─────────────────────────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wide">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: entry.color }}
            />
            {entry.name === 'revenue' ? 'Revenue' : 'Payouts'}
          </span>
          <span className="font-semibold text-slate-800">
            {formatCurrency(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Recharts Tooltip – Bar Chart
// ─────────────────────────────────────────────────────────────────────────────

function MethodTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 capitalize mb-1">{label}</p>
      <p className="text-slate-500">
        <span className="font-semibold text-slate-800">{entry.value}%</span> of transactions
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gateway Status Dot
// ─────────────────────────────────────────────────────────────────────────────

function GatewayStatusDot({ status }: { status: GatewayHealth['status'] }) {
  const cls =
    status === 'healthy'  ? 'bg-teal-500'  :
    status === 'degraded' ? 'bg-amber-500' :
                            'bg-rose-500';
  return (
    <span className={cn('inline-block w-2.5 h-2.5 rounded-full shrink-0', cls)} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Severity Dot
// ─────────────────────────────────────────────────────────────────────────────

function ActivityDot({ severity }: { severity?: RecentActivity['severity'] }) {
  const cls =
    severity === 'success' ? 'bg-teal-500'   :
    severity === 'warning' ? 'bg-amber-500'  :
    severity === 'error'   ? 'bg-rose-500'   :
                             'bg-indigo-500';
  return (
    <span className={cn('mt-1 inline-block w-2.5 h-2.5 rounded-full shrink-0', cls)} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction status → Badge variant mapping
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState<Period>('30D');

  // Slice revenue data based on selected period
  const chartData = useMemo(() => {
    const count = activePeriod === '7D' ? 7 : activePeriod === '30D' ? 30 : 90;
    const base = mockRevenueData.slice(-Math.min(count, mockRevenueData.length));
    // For 90D, repeat the 30-day data 3x with date offsets for visual richness
    if (activePeriod === '90D' && mockRevenueData.length < 90) {
      const repeated = [...base, ...base, ...base].slice(0, 90);
      return repeated.map((d, i) => ({
        ...d,
        date: new Date(
          new Date(base[0].date).getTime() + i * 86400000
        ).toISOString().slice(0, 10),
      }));
    }
    return base;
  }, [activePeriod]);

  // Format date label on x-axis
  const formatXAxis = (value: string) => {
    const d = new Date(value);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };

  // Build bar chart data from payment methods
  const methodChartData = mockPaymentMethodBreakdown.map((m) => ({
    name: m.method.charAt(0).toUpperCase() + m.method.slice(1),
    percentage: m.percentage,
    color: METHOD_COLORS[m.method],
  }));

  // Total transactions for donut center
  const totalTxnCount = mockTransactionStatusData.reduce((s, d) => s + d.count, 0);

  // Recent 5 transactions
  const recentTxns = mockTransactions.slice(0, 5);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-8">

      {/* ─── Welcome Banner ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()},{' '}
            <span className="gradient-text">Merchant Admin</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&rsquo;s what&rsquo;s happening with your payments today
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
            <Activity size={14} />
            {dateLabel}
          </span>
          <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold px-4 py-2.5 transition-colors shadow-sm">
            <Download size={14} />
            Download Report
          </button>
        </div>
      </div>

      {/* ─── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(mockDashboardKPI.totalRevenue)}
          change={mockDashboardKPI.revenueChange}
          changeLabel="vs last period"
          icon={<DollarSign size={18} />}
          iconBg="bg-indigo-50"
          accentColor="from-indigo-500 to-violet-500"
          className="animate-fade-in stagger-1 opacity-0"
        />
        <StatCard
          title="Total Transactions"
          value={mockDashboardKPI.totalTransactions.toLocaleString('en-IN')}
          change={mockDashboardKPI.transactionChange}
          changeLabel="vs last period"
          icon={<ArrowLeftRight size={18} />}
          iconBg="bg-teal-50"
          accentColor="from-teal-400 to-cyan-500"
          className="animate-fade-in stagger-2 opacity-0"
        />
        <StatCard
          title="Success Rate"
          value={`${mockDashboardKPI.successRate}%`}
          change={2.1}
          changeLabel="vs last period"
          icon={<CheckCircle size={18} />}
          iconBg="bg-emerald-50"
          accentColor="from-emerald-400 to-teal-500"
          className="animate-fade-in stagger-3 opacity-0"
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(mockDashboardKPI.pendingPayouts)}
          icon={<Clock size={18} />}
          iconBg="bg-amber-50"
          accentColor="from-amber-400 to-orange-400"
          className="animate-fade-in stagger-4 opacity-0"
        />
      </div>

      {/* ─── Charts Row 1 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Trend – 2 columns */}
        <Card className="lg:col-span-2 animate-fade-in stagger-1 opacity-0">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  Revenue Overview
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Revenue vs Payouts over time</p>
              </div>
              {/* Period tabs */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {PERIOD_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePeriod(tab)}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-semibold transition-all',
                      activePeriod === tab
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* SVG gradient defs */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="payoutsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.01} />
                </linearGradient>
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={activePeriod === '7D' ? 0 : activePeriod === '30D' ? 4 : 12}
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="payouts"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#payoutsGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            {/* Manual legend */}
            <div className="flex items-center justify-center gap-6 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block w-3 h-0.5 rounded-full bg-indigo-500" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block w-3 h-0.5 rounded-full bg-amber-400" />
                Payouts
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Status Donut – 1 column */}
        <Card className="animate-fade-in stagger-2 opacity-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={16} className="text-indigo-500" />
              Transaction Distribution
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">By status breakdown</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={mockTransactionStatusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {mockTransactionStatusData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_CHART_COLORS[entry.status] ?? '#CBD5E1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [(value as number).toLocaleString('en-IN'), '']}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #F1F5F9',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: 12,
                    }}
                  />
                  {/* Center label rendered via custom shape hack using a foreignObject label */}
                </PieChart>
              </ResponsiveContainer>
              {/* Absolute center text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-900 leading-none">
                  {totalTxnCount.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">total</span>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {mockTransactionStatusData.map((entry) => {
                const pct = ((entry.count / totalTxnCount) * 100).toFixed(1);
                return (
                  <div key={entry.status} className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: STATUS_CHART_COLORS[entry.status] ?? '#CBD5E1' }}
                    />
                    <span className="text-xs text-slate-500 truncate leading-none">
                      {entry.status.replace('_', ' ')}
                    </span>
                    <span className="ml-auto text-xs font-semibold text-slate-700 shrink-0">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts Row 2 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Payment Methods Bar Chart */}
        <Card className="animate-fade-in stagger-1 opacity-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-500" />
              Payment Methods
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Transaction share by method</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={methodChartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 55]}
                />
                <Tooltip content={<MethodTooltip />} />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#94A3B8', formatter: (v: unknown) => `${v}%` }}>
                  {methodChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Count pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              {mockPaymentMethodBreakdown.map((m) => (
                <span
                  key={m.method}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: METHOD_COLORS[m.method] }}
                  />
                  {m.method.charAt(0).toUpperCase() + m.method.slice(1)}: {m.count.toLocaleString('en-IN')} txns
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gateway Health */}
        <Card className="animate-fade-in stagger-2 opacity-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap size={16} className="text-indigo-500" />
                  Gateway Health
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Live status &amp; performance</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" title="Refresh">
                <RefreshCw size={14} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-4">
              {mockGatewayHealth.map((gw) => {
                const statusLabel =
                  gw.status === 'healthy'  ? 'Healthy'  :
                  gw.status === 'degraded' ? 'Degraded' : 'Down';
                const badgeVariant =
                  gw.status === 'healthy'  ? 'success'  :
                  gw.status === 'degraded' ? 'warning'  : 'error';
                const barColor =
                  gw.status === 'healthy'  ? 'bg-teal-500'  :
                  gw.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500';

                return (
                  <div key={gw.gateway} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <GatewayStatusDot status={gw.status} />
                        <span className="font-semibold text-sm text-slate-800">
                          {gw.gateway.charAt(0) + gw.gateway.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={badgeVariant} size="sm" dot>
                          {statusLabel}
                        </Badge>
                        <span className="text-xs text-slate-400">{gw.avgLatency}ms</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500">Success Rate</span>
                        <span className="text-xs font-semibold text-slate-700">{gw.successRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', barColor)}
                          style={{ width: `${gw.successRate}%` }}
                        />
                      </div>
                    </div>
                    {/* Last checked */}
                    <p className="text-[11px] text-slate-400">
                      Last checked: {formatRelativeTime(gw.lastChecked)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Bottom Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Transactions Table */}
        <Card className="animate-fade-in stagger-1 opacity-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight size={16} className="text-indigo-500" />
                  Recent Transactions
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Latest 5 payment events</p>
              </div>
              <Link
                href="/dashboard/transactions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View All
                <ExternalLink size={11} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-6 py-3">ID</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-3 py-3">Amount</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-3 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-3 py-3 hidden md:table-cell">Method</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-3 py-3 hidden lg:table-cell">Gateway</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-6 py-3 hidden xl:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map((txn, idx) => (
                    <tr
                      key={txn.id}
                      className={cn(
                        'group transition-colors hover:bg-slate-50/70',
                        idx !== recentTxns.length - 1 && 'border-b border-slate-50'
                      )}
                    >
                      {/* ID */}
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs text-indigo-600 font-medium">
                          {txn.id.slice(0, 14)}&hellip;
                        </span>
                      </td>
                      {/* Amount */}
                      <td className="px-3 py-3.5 text-right">
                        <span className="font-semibold text-slate-800 text-xs">
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3.5">
                        <Badge variant={txnBadgeVariant(txn.status)} size="sm" dot>
                          {txn.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      {/* Method */}
                      <td className="px-3 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-500 capitalize">
                          {txn.paymentMethod ?? '—'}
                        </span>
                      </td>
                      {/* Gateway */}
                      <td className="px-3 py-3.5 hidden lg:table-cell">
                        <span className="text-xs font-medium text-slate-600">
                          {txn.gateway.charAt(0) + txn.gateway.slice(1).toLowerCase()}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="px-6 py-3.5 hidden xl:table-cell">
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {formatRelativeTime(txn.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">Showing 5 of {mockTransactions.length} transactions</span>
              <Link
                href="/dashboard/transactions"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
              >
                View all transactions
                <ExternalLink size={10} />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="animate-fade-in stagger-2 opacity-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={16} className="text-indigo-500" />
              Recent Activity
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Platform events &amp; alerts</p>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-0">
              {mockRecentActivity.map((item, idx) => (
                <div key={item.id} className="relative flex gap-3">
                  {/* Vertical connector line */}
                  {idx !== mockRecentActivity.length - 1 && (
                    <span className="absolute left-[4.5px] top-5 bottom-0 w-px bg-slate-100" />
                  )}
                  <ActivityDot severity={item.severity} />
                  <div className="flex-1 pb-4 min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400">{formatRelativeTime(item.timestamp)}</span>
                      {item.type !== 'system' && (
                        <span
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5',
                            item.type === 'payment'  && 'bg-indigo-50 text-indigo-600',
                            item.type === 'payout'   && 'bg-teal-50 text-teal-600',
                            item.type === 'webhook'  && 'bg-amber-50 text-amber-600',
                            item.type === 'alert'    && 'bg-rose-50 text-rose-600',
                            item.type === 'kyc'      && 'bg-purple-50 text-purple-600',
                          )}
                        >
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
