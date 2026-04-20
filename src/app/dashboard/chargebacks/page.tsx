'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle, XCircle, Filter } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Chargeback, ChargebackStatus } from '@/types';

const STATUS_TABS: Array<{ value: ChargebackStatus | 'ALL'; label: string }> = [
  { value: 'ALL',       label: 'All' },
  { value: 'PENDING',   label: 'Pending' },
  { value: 'ACCEPTED',  label: 'Accepted' },
  { value: 'REJECTED',  label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'EXPIRED',   label: 'Expired' },
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
  const [chargebacks, setChargebacks] = useState<Chargeback[]>([]);
  const [loadingId,   setLoadingId]   = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);

  const loadChargebacks = useCallback(() => {
    setLoading(true);
    fetchWithAuth('/api/v1/chargebacks?perPage=200')
      .then(r => r.json())
      .then(d => { if (d.success) setChargebacks(d.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadChargebacks(); }, [loadChargebacks]);

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
    pendingActions: resolvedChargebacks.filter((cb) => cb.status === 'PENDING').length,
    accepted:       resolvedChargebacks.filter((cb) => cb.status === 'ACCEPTED').length,
    rejected:       resolvedChargebacks.filter((cb) => cb.status === 'REJECTED').length,
  }), [resolvedChargebacks]);

  async function handleAction(id: string, action: 'ACCEPT' | 'REJECT') {
    setLoadingId(id);
    try {
      const res = await fetchWithAuth(`/api/v1/chargebacks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const json = await res.json();
        setChargebacks((prev) => prev.map((cb) => (cb.id === id ? json.data : cb)));
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-5 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ShieldAlert size={20} style={{ color: '#F87171' }} />
            Chargebacks
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Final refund decisions — accept or reject within the deadline
          </p>
        </div>
        <button
          onClick={loadChargebacks}
          className="inline-flex items-center gap-2 text-xs font-semibold transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Chargebacks', value: stats.total,          color: 'var(--text-primary)', bg: 'rgba(255,255,255,0.04)',    border: 'var(--border)' },
          { label: 'Pending Actions',   value: stats.pendingActions, color: '#FCD34D',              bg: 'rgba(252,211,77,0.08)',     border: 'rgba(252,211,77,0.2)' },
          { label: 'Accepted',          value: stats.accepted,       color: '#34D399',              bg: 'rgba(52,211,153,0.08)',     border: 'rgba(52,211,153,0.2)' },
          { label: 'Rejected',          value: stats.rejected,       color: '#F87171',              bg: 'rgba(248,113,113,0.08)',    border: 'rgba(248,113,113,0.2)' },
        ].map((s) => (
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
              Chargeback Records
            </CardTitle>
            <div
              className="flex items-center gap-0.5 rounded-xl p-1 flex-wrap"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
            >
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveStatus(tab.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
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
                  {['Chargeback ID', 'Dispute ID', 'Amount', 'Status', 'Deadline', 'Days Left', 'Actions'].map((h) => (
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
                    <td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                      No chargebacks found
                    </td>
                  </tr>
                ) : (
                  filtered.map((cb, idx) => {
                    const daysLeft  = getDaysRemaining(cb.deadline);
                    const isPending = cb.status === 'PENDING';
                    const isLoading = loadingId === cb.id;

                    return (
                      <tr
                        key={cb.id}
                        className="table-row-dark"
                        style={{ borderBottom: idx !== filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : undefined }}
                      >
                        <td className="px-6 py-3.5">
                          <span className="font-mono text-xs font-medium" style={{ color: 'var(--primary)' }}>
                            {cb.id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {cb.disputeId}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                            {formatCurrency(cb.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={chargebackBadgeVariant(cb.status)} size="sm" dot>
                            {cb.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(cb.deadline).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="text-xs font-semibold"
                            style={{
                              color: isPending && daysLeft <= 3 ? '#F87171' :
                                     isPending && daysLeft <= 7 ? '#FCD34D' :
                                     'var(--text-muted)',
                            }}
                          >
                            {isPending ? `${daysLeft}d` : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 pr-6">
                          {isPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction(cb.id, 'ACCEPT')}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                                style={{
                                  background: 'rgba(52,211,153,0.12)',
                                  color: '#34D399',
                                  border: '1px solid rgba(52,211,153,0.25)',
                                }}
                              >
                                <CheckCircle size={11} />
                                Accept
                              </button>
                              <button
                                onClick={() => handleAction(cb.id, 'REJECT')}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                                style={{
                                  background: 'rgba(248,113,113,0.12)',
                                  color: '#F87171',
                                  border: '1px solid rgba(248,113,113,0.25)',
                                }}
                              >
                                <XCircle size={11} />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {filtered.length} of {resolvedChargebacks.length} chargebacks
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
