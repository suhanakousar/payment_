'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Filter, RefreshCw } from 'lucide-react';
import { mockDisputes } from '@/lib/mock-data';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Dispute, DisputeStatus } from '@/types';

const STATUS_TABS: Array<{ value: DisputeStatus | 'ALL'; label: string }> = [
  { value: 'ALL',          label: 'All' },
  { value: 'PENDING',      label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'RESOLVED',     label: 'Resolved' },
];

const REASON_LABELS: Record<Dispute['reason'], string> = {
  FAILED_PAYMENT: 'Failed Payment',
  RETURN:         'Return',
  COMPLAINT:      'Complaint',
};

function disputeBadgeVariant(
  status: DisputeStatus
): 'warning' | 'info' | 'success' | 'default' {
  const map: Record<DisputeStatus, 'warning' | 'info' | 'success' | 'default'> = {
    PENDING:      'warning',
    UNDER_REVIEW: 'info',
    RESOLVED:     'success',
  };
  return map[status] ?? 'default';
}

function reasonBadgeVariant(
  reason: Dispute['reason']
): 'error' | 'warning' | 'info' {
  const map: Record<Dispute['reason'], 'error' | 'warning' | 'info'> = {
    FAILED_PAYMENT: 'error',
    RETURN:         'warning',
    COMPLAINT:      'info',
  };
  return map[reason];
}

export default function DisputesPage() {
  const [activeStatus, setActiveStatus] = useState<DisputeStatus | 'ALL'>('ALL');
  const [disputes] = useState<Dispute[]>(mockDisputes);

  const filtered = useMemo(() => {
    if (activeStatus === 'ALL') return disputes;
    return disputes.filter((d) => d.status === activeStatus);
  }, [disputes, activeStatus]);

  const stats = useMemo(() => ({
    total:       disputes.length,
    pending:     disputes.filter((d) => d.status === 'PENDING').length,
    underReview: disputes.filter((d) => d.status === 'UNDER_REVIEW').length,
    resolved:    disputes.filter((d) => d.status === 'RESOLVED').length,
  }), [disputes]);

  return (
    <div className="space-y-6 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            Disputes
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Track and manage payment dispute cases
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
          { label: 'Total Disputes',    value: stats.total,       color: 'text-slate-800',   bg: 'bg-slate-50',  border: 'border-slate-100' },
          { label: 'Pending',           value: stats.pending,     color: 'text-amber-700',   bg: 'bg-amber-50',  border: 'border-amber-100' },
          { label: 'Under Review',      value: stats.underReview, color: 'text-indigo-700',  bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Resolved',          value: stats.resolved,    color: 'text-teal-700',    bg: 'bg-teal-50',   border: 'border-teal-100' },
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
              Dispute Records
            </CardTitle>
            {/* Status filter tabs */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveStatus(tab.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
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
                  {['Dispute ID', 'Transaction ID', 'Amount', 'Reason', 'Status', 'Date'].map((h) => (
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
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                      No disputes found
                    </td>
                  </tr>
                ) : (
                  filtered.map((dispute, idx) => (
                    <tr
                      key={dispute.id}
                      className={cn(
                        'group transition-colors hover:bg-slate-50/70',
                        idx !== filtered.length - 1 && 'border-b border-slate-50'
                      )}
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs text-indigo-600 font-medium">
                          {dispute.id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-600">
                          {dispute.transactionId.slice(0, 14)}&hellip;
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 text-xs">
                          {formatCurrency(dispute.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={reasonBadgeVariant(dispute.reason)} size="sm">
                          {REASON_LABELS[dispute.reason]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={disputeBadgeVariant(dispute.status)} size="sm" dot>
                          {dispute.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 pr-6">
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(dispute.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Showing {filtered.length} of {disputes.length} disputes
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
