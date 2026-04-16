'use client';

import { useState, useMemo } from 'react';
import { ShieldAlert, Filter, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { mockChargebacks } from '@/lib/mock-data';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Chargeback, ChargebackStatus } from '@/types';

const STATUS_TABS: Array<{ value: ChargebackStatus | 'ALL'; label: string }> = [
  { value: 'ALL',      label: 'All' },
  { value: 'PENDING',  label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED',label: 'Completed' },
  { value: 'EXPIRED',  label: 'Expired' },
];

function chargebackBadgeVariant(
  status: ChargebackStatus
): 'warning' | 'success' | 'error' | 'info' | 'default' {
  const map: Record<ChargebackStatus, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
    PENDING:   'warning',
    ACCEPTED:  'success',
    REJECTED:  'error',
    COMPLETED: 'info',
    EXPIRED:   'default',
  };
  return map[status] ?? 'default';
}

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function ChargebacksPage() {
  const [activeStatus, setActiveStatus] = useState<ChargebackStatus | 'ALL'>('ALL');
  const [chargebacks, setChargebacks] = useState<Chargeback[]>(mockChargebacks);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const now = new Date();
  const resolvedChargebacks = useMemo(() =>
    chargebacks.map((cb) => {
      if (cb.status === 'PENDING' && new Date(cb.deadline) < now) {
        return { ...cb, status: 'EXPIRED' as ChargebackStatus };
      }
      return cb;
    }),
    [chargebacks]
  );

  const filtered = useMemo(() => {
    if (activeStatus === 'ALL') return resolvedChargebacks;
    return resolvedChargebacks.filter((cb) => cb.status === activeStatus);
  }, [resolvedChargebacks, activeStatus]);

  const stats = useMemo(() => ({
    total:          resolvedChargebacks.length,
    pending:        resolvedChargebacks.filter((cb) => cb.status === 'PENDING').length,
    pendingActions: resolvedChargebacks.filter((cb) => cb.status === 'PENDING').length,
    accepted:       resolvedChargebacks.filter((cb) => cb.status === 'ACCEPTED').length,
    rejected:       resolvedChargebacks.filter((cb) => cb.status === 'REJECTED').length,
  }), [resolvedChargebacks]);

  async function handleAction(id: string, action: 'ACCEPT' | 'REJECT') {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/v1/chargebacks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const json = await res.json();
        setChargebacks((prev) =>
          prev.map((cb) => (cb.id === id ? json.data : cb))
        );
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-500" />
            Chargebacks
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Final refund decisions — accept or reject within the deadline
          </p>
        </div>
        <button className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Chargebacks', value: stats.total,          color: 'text-slate-800',  bg: 'bg-slate-50',  border: 'border-slate-100' },
          { label: 'Pending Actions',   value: stats.pendingActions, color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-100' },
          { label: 'Accepted',          value: stats.accepted,       color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-100' },
          { label: 'Rejected',          value: stats.rejected,       color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-100' },
        ].map((s) => (
          <div
            key={s.label}
            className={cn('rounded-xl border p-4', s.bg, s.border)}
          >
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className={cn('text-2xl font-extrabold mt-1', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Filter size={15} className="text-indigo-500" />
              Chargeback Records
            </CardTitle>
            {/* Status filter tabs */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1 flex-wrap">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveStatus(tab.value)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    activeStatus === tab.value
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Chargeback ID', 'Dispute ID', 'Amount', 'Status', 'Deadline', 'Days Left', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-5 py-3 first:pl-6 last:pr-6"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                      No chargebacks found
                    </td>
                  </tr>
                ) : (
                  filtered.map((cb, idx) => {
                    const daysLeft = getDaysRemaining(cb.deadline);
                    const isPending = cb.status === 'PENDING';
                    const isLoading = loadingId === cb.id;

                    return (
                      <tr
                        key={cb.id}
                        className={cn(
                          'group transition-colors hover:bg-slate-50/70',
                          idx !== filtered.length - 1 && 'border-b border-slate-50'
                        )}
                      >
                        <td className="px-6 py-3.5">
                          <span className="font-mono text-xs text-indigo-600 font-medium">
                            {cb.id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-slate-600">
                            {cb.disputeId}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-800 text-xs">
                            {formatCurrency(cb.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={chargebackBadgeVariant(cb.status)} size="sm" dot>
                            {cb.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(cb.deadline).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            'text-xs font-semibold',
                            isPending && daysLeft <= 3 ? 'text-rose-600' :
                            isPending && daysLeft <= 7 ? 'text-amber-600' :
                            'text-slate-500'
                          )}>
                            {isPending ? `${daysLeft}d` : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 pr-6">
                          {isPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction(cb.id, 'ACCEPT')}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle size={11} />
                                Accept
                              </button>
                              <button
                                onClick={() => handleAction(cb.id, 'REJECT')}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                              >
                                <XCircle size={11} />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Showing {filtered.length} of {resolvedChargebacks.length} chargebacks
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
