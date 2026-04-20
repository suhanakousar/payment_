'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Filter } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
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

function disputeBadgeVariant(status: DisputeStatus): 'warning' | 'info' | 'success' | 'default' {
  const map: Record<DisputeStatus, 'warning' | 'info' | 'success' | 'default'> = {
    PENDING:      'warning',
    UNDER_REVIEW: 'info',
    RESOLVED:     'success',
  };
  return map[status] ?? 'default';
}

function reasonBadgeVariant(reason: Dispute['reason']): 'error' | 'warning' | 'info' {
  const map: Record<Dispute['reason'], 'error' | 'warning' | 'info'> = {
    FAILED_PAYMENT: 'error',
    RETURN:         'warning',
    COMPLAINT:      'info',
  };
  return map[reason];
}

const STAT_CARDS = (stats: { total: number; pending: number; underReview: number; resolved: number }) => [
  { label: 'Total Disputes', value: stats.total,       color: 'var(--text-primary)',  bg: 'rgba(255,255,255,0.04)',    border: 'var(--border)' },
  { label: 'Pending',        value: stats.pending,     color: '#FCD34D',              bg: 'rgba(252,211,77,0.08)',     border: 'rgba(252,211,77,0.2)' },
  { label: 'Under Review',   value: stats.underReview, color: '#22D3EE',              bg: 'rgba(34,211,238,0.08)',     border: 'rgba(34,211,238,0.2)' },
  { label: 'Resolved',       value: stats.resolved,    color: '#34D399',              bg: 'rgba(52,211,153,0.08)',     border: 'rgba(52,211,153,0.2)' },
];

export default function DisputesPage() {
  const [activeStatus, setActiveStatus] = useState<DisputeStatus | 'ALL'>('ALL');
  const [disputes,  setDisputes]  = useState<Dispute[]>([]);
  const [loading,   setLoading]   = useState(true);

  const loadDisputes = useCallback(() => {
    setLoading(true);
    fetchWithAuth('/api/v1/disputes?perPage=200')
      .then(r => r.json())
      .then(d => { if (d.success) setDisputes(d.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDisputes(); }, [loadDisputes]);

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
    <div className="space-y-5 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <AlertTriangle size={20} style={{ color: '#FCD34D' }} />
            Disputes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Track and manage payment dispute cases
          </p>
        </div>
        <button
          onClick={loadDisputes}
          className="inline-flex items-center gap-2 text-xs font-semibold transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS(stats).map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {s.label}
            </p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Filter size={14} style={{ color: 'var(--primary)' }} />
              Dispute Records
            </CardTitle>
            <div
              className="flex items-center gap-0.5 rounded-xl p-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
            >
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveStatus(tab.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: activeStatus === tab.value ? 'var(--primary)' : 'transparent',
                    color: activeStatus === tab.value ? '#060C1A' : 'var(--text-secondary)',
                  }}
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
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Dispute ID', 'Transaction ID', 'Amount', 'Reason', 'Status', 'Date'].map((h) => (
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                      No disputes found
                    </td>
                  </tr>
                ) : (
                  filtered.map((dispute, idx) => (
                    <tr
                      key={dispute.id}
                      className="table-row-dark"
                      style={{ borderBottom: idx !== filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : undefined }}
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs font-medium" style={{ color: 'var(--primary)' }}>
                          {dispute.id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {dispute.transactionId.slice(0, 14)}&hellip;
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
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
                        <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          {new Date(dispute.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {filtered.length} of {disputes.length} disputes
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
