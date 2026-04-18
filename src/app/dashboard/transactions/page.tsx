'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Copy,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  Smartphone,
  Globe,
  Wallet,
  Check,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  RotateCcw,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

import { cn, formatCurrency, formatDate, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, paymentStatusVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';

import type { Transaction, TxnStatus } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const GATEWAYS = ['RAZORPAY', 'CASHFREE', 'STRIPE'] as const;
const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'wallet'] as const;
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const QUICK_FILTER_TABS: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'all' },
  { label: 'Successful', value: 'CAPTURED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Refunded', value: 'REFUNDED' },
];

const GATEWAY_COLORS: Record<string, string> = {
  RAZORPAY: 'bg-blue-500',
  CASHFREE: 'bg-emerald-500',
  STRIPE:   'bg-violet-500',
  AUTO:     'bg-slate-400',
};

const EXPORT_COLUMNS = [
  { key: 'id',            label: 'Transaction ID' },
  { key: 'customerEmail', label: 'Customer Email' },
  { key: 'customerPhone', label: 'Customer Phone' },
  { key: 'amount',        label: 'Amount' },
  { key: 'currency',      label: 'Currency' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'gateway',       label: 'Gateway' },
  { key: 'status',        label: 'Status' },
  { key: 'createdAt',     label: 'Created At' },
  { key: 'gatewayOrderId',   label: 'Gateway Order ID' },
  { key: 'gatewayPaymentId', label: 'Gateway Payment ID' },
];

const MOCK_WEBHOOK_EVENTS = (txnId: string) => [
  {
    id: `wh_${txnId}_01`,
    event: 'payment.created',
    status: 'SUCCESS',
    timestamp: new Date(Date.now() - 3600_000).toISOString(),
    responseCode: 200,
  },
  {
    id: `wh_${txnId}_02`,
    event: 'payment.authorized',
    status: 'SUCCESS',
    timestamp: new Date(Date.now() - 3580_000).toISOString(),
    responseCode: 200,
  },
  {
    id: `wh_${txnId}_03`,
    event: 'payment.captured',
    status: 'SUCCESS',
    timestamp: new Date(Date.now() - 3540_000).toISOString(),
    responseCode: 200,
  },
];

function getPaymentMethodIcon(method: string) {
  switch (method) {
    case 'card':       return <CreditCard size={14} />;
    case 'upi':        return <Smartphone size={14} />;
    case 'netbanking': return <Globe size={14} />;
    case 'wallet':     return <Wallet size={14} />;
    default:           return <CreditCard size={14} />;
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'card':       return 'Card';
    case 'upi':        return 'UPI';
    case 'netbanking': return 'Net Banking';
    case 'wallet':     return 'Wallet';
    default:           return method;
  }
}

function statusToBadgeVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'pending' | 'default' {
  switch (status) {
    case 'CAPTURED':           return 'success';
    case 'FAILED':             return 'error';
    case 'PENDING':            return 'pending';
    case 'REFUNDED':           return 'warning';
    case 'AUTHORIZED':         return 'info';
    case 'PARTIALLY_REFUNDED': return 'info';
    default:                   return 'default';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'CAPTURED':           return 'Captured';
    case 'FAILED':             return 'Failed';
    case 'PENDING':            return 'Pending';
    case 'REFUNDED':           return 'Refunded';
    case 'AUTHORIZED':         return 'Authorized';
    case 'PARTIALLY_REFUNDED': return 'Partial Refund';
    default:                   return status;
  }
}

function getTimeline(txn: Transaction) {
  const steps: Array<{ label: string; timestamp: string; done: boolean }> = [
    { label: 'Initiated', timestamp: txn.createdAt, done: true },
  ];

  if (['AUTHORIZED', 'CAPTURED', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(txn.status)) {
    const t = new Date(txn.createdAt).getTime() + 8_000;
    steps.push({ label: 'Authorized', timestamp: new Date(t).toISOString(), done: true });
  }

  if (['CAPTURED', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(txn.status)) {
    const t = new Date(txn.createdAt).getTime() + 18_000;
    steps.push({ label: 'Captured', timestamp: new Date(t).toISOString(), done: true });
  }

  if (txn.status === 'FAILED') {
    const t = new Date(txn.updatedAt).getTime();
    steps.push({ label: 'Failed', timestamp: new Date(t).toISOString(), done: true });
  }

  if (txn.status === 'REFUNDED') {
    steps.push({ label: 'Refunded', timestamp: txn.updatedAt, done: true });
  }

  if (txn.status === 'PARTIALLY_REFUNDED') {
    steps.push({ label: 'Partially Refunded', timestamp: txn.updatedAt, done: true });
  }

  return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    },
    [text]
  );

  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded transition-all duration-150',
        'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50',
        className
      )}
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide-over detail panel
// ─────────────────────────────────────────────────────────────────────────────

function TransactionDetailPanel({
  txn,
  onClose,
}: {
  txn: Transaction | null;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!txn) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [txn, onClose]);

  if (!txn) return null;

  const timeline   = getTimeline(txn);
  const webhookEvt = MOCK_WEBHOOK_EVENTS(txn.id);

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white',
          'shadow-[−24px_0_48px_-8px_rgba(0,0,0,0.15)]',
          'flex flex-col overflow-hidden',
          'animate-slide-in-right'
        )}
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-0.5">Transaction Detail</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-800">{txn.id}</span>
              <CopyButton text={txn.id} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Status + Amount hero */}
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <Badge
                variant={statusToBadgeVariant(txn.status)}
                size="md"
                dot
                className="text-sm px-3 py-1"
              >
                {statusLabel(txn.status)}
              </Badge>
              <span className="text-xs text-slate-500">{formatDate(txn.createdAt)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{formatCurrency(txn.amount, txn.currency)}</span>
              <span className="text-sm font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">
                {txn.currency}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Status Timeline</h3>
            <ol className="relative space-y-0">
              {timeline.map((step, idx) => (
                <li key={step.label} className="flex gap-4">
                  {/* spine */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2',
                        step.done
                          ? txn.status === 'FAILED' && idx === timeline.length - 1
                            ? 'bg-red-50 border-red-300 text-red-500'
                            : 'bg-indigo-50 border-indigo-300 text-indigo-600'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      )}
                    >
                      {txn.status === 'FAILED' && idx === timeline.length - 1 ? (
                        <XCircle size={13} />
                      ) : step.done ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <Clock size={13} />
                      )}
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 my-1 min-h-[20px]" />
                    )}
                  </div>
                  {/* content */}
                  <div className="pb-4">
                    <p className="text-sm font-medium text-slate-800">{step.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(step.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Customer Details */}
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Customer Details</h3>
            <dl className="space-y-2.5">
              <DetailRow label="Email" value={txn.customerEmail ?? '—'} />
              <DetailRow label="Phone" value={txn.customerPhone ?? '—'} />
            </dl>
          </div>

          {/* Payment Details */}
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Payment Details</h3>
            <dl className="space-y-2.5">
              <DetailRow label="Method" value={getPaymentMethodLabel(txn.paymentMethod ?? '')} />
              <DetailRow label="Gateway" value={txn.gateway} />
              <DetailRow label="Gateway Order ID" value={txn.gatewayOrderId} mono />
              {txn.gatewayPaymentId && (
                <DetailRow label="Gateway Payment ID" value={txn.gatewayPaymentId} mono />
              )}
            </dl>
          </div>

          {/* Metadata */}
          {txn.metadata && Object.keys(txn.metadata).length > 0 && (
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Metadata</h3>
              <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(txn.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Webhook Events */}
          <div className="px-6 py-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Webhook Events</h3>
            <div className="space-y-2">
              {webhookEvt.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-mono font-medium text-slate-700">{evt.event}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(evt.timestamp)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5">
                    {evt.responseCode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-white">
          {txn.status === 'CAPTURED' && (
            <Button variant="danger" size="sm" leftIcon={<RotateCcw size={14} />}>
              Initiate Refund
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Copy size={14} />}
            onClick={() => navigator.clipboard.writeText(txn.id)}
          >
            Copy Transaction ID
          </Button>
        </div>
      </div>

      {/* Keyframe injected via style tag */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs text-slate-500 shrink-0 w-36">{label}</dt>
      <dd className={cn('text-xs text-slate-800 text-right break-all', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Modal
// ─────────────────────────────────────────────────────────────────────────────

function ExportModal({
  open,
  onClose,
  totalCount,
  filteredCount,
  selectedCount,
}: {
  open: boolean;
  onClose: () => void;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
}) {
  const [scope, setScope]         = useState<'all' | 'filtered' | 'selected'>('all');
  const [format, setFormat]       = useState<'csv' | 'excel'>('csv');
  const [columns, setColumns]     = useState<Set<string>>(new Set(EXPORT_COLUMNS.map((c) => c.key)));
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [success, setSuccess]     = useState(false);
  const [exporting, setExporting] = useState(false);

  const toggleColumn = (key: string) => {
    setColumns((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setSuccess(true);
    }, 1200);
  };

  const handleClose = () => {
    setSuccess(false);
    setExporting(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader onClose={handleClose}>
        <ModalTitle>Export Transactions</ModalTitle>
        <ModalDescription>Choose what to export and in which format.</ModalDescription>
      </ModalHeader>

      <ModalBody className="space-y-5">
        {success ? (
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">Export Started</p>
              <p className="text-sm text-slate-500 mt-1">
                You&apos;ll receive an email when your export is ready.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Scope */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Export scope</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { val: 'all',      label: 'All Transactions', count: totalCount },
                    { val: 'filtered', label: 'Filtered Only',    count: filteredCount },
                    { val: 'selected', label: 'Selected Only',    count: selectedCount },
                  ] as const
                ).map(({ val, label, count }) => (
                  <button
                    key={val}
                    onClick={() => setScope(val)}
                    disabled={val === 'selected' && selectedCount === 0}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all duration-150',
                      scope === val
                        ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300',
                      val === 'selected' && selectedCount === 0 && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <p className="text-xs font-semibold text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{count} records</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Date range (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  label="From"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <Input
                  type="date"
                  label="To"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Columns */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Columns to include</p>
              <div className="grid grid-cols-2 gap-1.5">
                {EXPORT_COLUMNS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={columns.has(key)}
                      onChange={() => toggleColumn(key)}
                      className="w-3.5 h-3.5 rounded accent-indigo-500"
                    />
                    <span className="text-xs text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Format</p>
              <div className="flex gap-3">
                {(['csv', 'excel'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150',
                      format === fmt
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <FileSpreadsheet size={15} />
                    {fmt === 'csv' ? 'CSV' : 'Excel (.xlsx)'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        {success ? (
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              leftIcon={<Download size={15} />}
              onClick={handleExport}
              loading={exporting}
            >
              Export
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort indicator
// ─────────────────────────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: 'asc' | 'desc' }) {
  if (sortField !== field) return <ArrowUpDown size={13} className="text-slate-300" />;
  return sortDir === 'asc'
    ? <ArrowUp size={13} className="text-indigo-500" />
    : <ArrowDown size={13} className="text-indigo-500" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  // ── remote data ───────────────────────────────────────────────────────────
  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [fetchTick,     setFetchTick]     = useState(0);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/v1/transactions?limit=200', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => { if (json.success) setTransactions(json.data ?? []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [fetchTick]);

  // ── filter state ──────────────────────────────────────────────────────────
  const [filterOpen,    setFilterOpen]    = useState(false);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<string[]>([]);
  const [gatewayFilter, setGatewayFilter] = useState<string>('');
  const [methodFilter,  setMethodFilter]  = useState<string>('');
  const [amountMin,     setAmountMin]     = useState('');
  const [amountMax,     setAmountMax]     = useState('');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [pendingFilters, setPendingFilters] = useState({
    search: '', statusFilter: [] as string[], gatewayFilter: '',
    methodFilter: '', amountMin: '', amountMax: '', dateFrom: '', dateTo: '',
  });

  // ── quick tab ─────────────────────────────────────────────────────────────
  const [quickTab, setQuickTab] = useState('all');

  // ── sort ──────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<'amount' | 'createdAt' | 'status'>('createdAt');
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('desc');

  // ── selection ─────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── pagination ────────────────────────────────────────────────────────────
  const [page,    setPage]    = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [jumpTo,  setJumpTo]  = useState('');

  // ── panels / modals ──────────────────────────────────────────────────────
  const [detailTxn,     setDetailTxn]     = useState<Transaction | null>(null);
  const [exportOpen,    setExportOpen]    = useState(false);
  const [refreshSpin,   setRefreshSpin]   = useState(false);

  // ── derived: active filter count ─────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (search)                   n++;
    if (statusFilter.length > 0)  n++;
    if (gatewayFilter)            n++;
    if (methodFilter)             n++;
    if (amountMin || amountMax)   n++;
    if (dateFrom || dateTo)       n++;
    return n;
  }, [search, statusFilter, gatewayFilter, methodFilter, amountMin, amountMax, dateFrom, dateTo]);

  // ── filtered data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...transactions];

    // Quick tab
    if (quickTab !== 'all') {
      data = data.filter((t) => t.status === quickTab);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.customerEmail?.toLowerCase().includes(q) ||
          t.customerPhone?.includes(q) ||
          t.gatewayOrderId.toLowerCase().includes(q)
      );
    }

    // Status multi-select
    if (statusFilter.length > 0) {
      data = data.filter((t) => statusFilter.includes(t.status));
    }

    // Gateway
    if (gatewayFilter) {
      data = data.filter((t) => t.gateway === gatewayFilter);
    }

    // Method
    if (methodFilter) {
      data = data.filter((t) => t.paymentMethod === methodFilter);
    }

    // Amount range (₹ input → paise)
    if (amountMin) {
      data = data.filter((t) => t.amount >= parseFloat(amountMin) * 100);
    }
    if (amountMax) {
      data = data.filter((t) => t.amount <= parseFloat(amountMax) * 100);
    }

    // Date range
    if (dateFrom) {
      data = data.filter((t) => new Date(t.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      data = data.filter((t) => new Date(t.createdAt) <= end);
    }

    // Sort
    data.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'amount')    cmp = a.amount - b.amount;
      if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortField === 'status')    cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [transactions, search, statusFilter, gatewayFilter, methodFilter, amountMin, amountMax, dateFrom, dateTo, quickTab, sortField, sortDir]);

  // ── tab counts ────────────────────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: transactions.length };
    transactions.forEach((t) => {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    });
    return counts;
  }, [transactions]);

  // ── paginated slice ───────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * perPage;
  const pageRows   = filtered.slice(start, start + perPage);

  // ── handlers ──────────────────────────────────────────────────────────────
  const toggleSort = (field: 'amount' | 'createdAt' | 'status') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (pageRows.every((r) => selected.has(r.id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        pageRows.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pageRows.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter([]);
    setGatewayFilter('');
    setMethodFilter('');
    setAmountMin('');
    setAmountMax('');
    setDateFrom('');
    setDateTo('');
    setQuickTab('all');
    setPage(1);
  };

  const applyFilters = () => {
    setSearch(pendingFilters.search);
    setStatusFilter(pendingFilters.statusFilter);
    setGatewayFilter(pendingFilters.gatewayFilter);
    setMethodFilter(pendingFilters.methodFilter);
    setAmountMin(pendingFilters.amountMin);
    setAmountMax(pendingFilters.amountMax);
    setDateFrom(pendingFilters.dateFrom);
    setDateTo(pendingFilters.dateTo);
    setPage(1);
    setFilterOpen(false);
  };

  // sync pending when filter panel opens
  useEffect(() => {
    if (filterOpen) {
      setPendingFilters({ search, statusFilter, gatewayFilter, methodFilter, amountMin, amountMax, dateFrom, dateTo });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOpen]);

  const handleRefresh = () => {
    setRefreshSpin(true);
    setFetchTick((t) => t + 1);
    setTimeout(() => setRefreshSpin(false), 900);
  };

  const toggleStatusTag = (s: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      statusFilter: prev.statusFilter.includes(s)
        ? prev.statusFilter.filter((x) => x !== s)
        : [...prev.statusFilter, s],
    }));
  };

  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const somePageSelected = pageRows.some((r) => selected.has(r.id));

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 min-h-full">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage all payment transactions</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={15} />}
            onClick={() => setExportOpen(true)}
          >
            Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw size={15} className={cn(refreshSpin && 'animate-spin')} />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Advanced Filter Bar ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={cn(
              'inline-flex items-center gap-2 px-3 h-9 rounded-lg border text-sm font-medium transition-all duration-150',
              filterOpen
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            )}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-rose-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {filterOpen && (
          <Card className="border border-slate-200">
            <CardContent className="p-4 space-y-3">
              {/* Row 1: search + status tags */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search by ID, email, phone, order ID…"
                    leftIcon={<Search size={14} />}
                    value={pendingFilters.search}
                    onChange={(e) => setPendingFilters((p) => ({ ...p, search: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(['CAPTURED', 'FAILED', 'PENDING', 'REFUNDED', 'AUTHORIZED'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStatusTag(s)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                        pendingFilters.statusFilter.includes(s)
                          ? 'border-indigo-400 bg-indigo-100 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {statusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: gateway, method, amount range, date range */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* Gateway */}
                <select
                  value={pendingFilters.gatewayFilter}
                  onChange={(e) => setPendingFilters((p) => ({ ...p, gatewayFilter: e.target.value }))}
                  className="col-span-1 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                >
                  <option value="">All Gateways</option>
                  {GATEWAYS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>

                {/* Method */}
                <select
                  value={pendingFilters.methodFilter}
                  onChange={(e) => setPendingFilters((p) => ({ ...p, methodFilter: e.target.value }))}
                  className="col-span-1 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                >
                  <option value="">All Methods</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{getPaymentMethodLabel(m)}</option>)}
                </select>

                {/* Amount min */}
                <Input
                  placeholder="Min ₹"
                  type="number"
                  value={pendingFilters.amountMin}
                  onChange={(e) => setPendingFilters((p) => ({ ...p, amountMin: e.target.value }))}
                />

                {/* Amount max */}
                <Input
                  placeholder="Max ₹"
                  type="number"
                  value={pendingFilters.amountMax}
                  onChange={(e) => setPendingFilters((p) => ({ ...p, amountMax: e.target.value }))}
                />

                {/* Date from */}
                <Input
                  type="date"
                  value={pendingFilters.dateFrom}
                  onChange={(e) => setPendingFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                />

                {/* Date to */}
                <Input
                  type="date"
                  value={pendingFilters.dateTo}
                  onChange={(e) => setPendingFilters((p) => ({ ...p, dateTo: e.target.value }))}
                />
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() =>
                    setPendingFilters({
                      search: '', statusFilter: [], gatewayFilter: '',
                      methodFilter: '', amountMin: '', amountMax: '', dateFrom: '', dateTo: '',
                    })
                  }
                  className="text-xs text-slate-500 hover:text-rose-500 transition-colors"
                >
                  Clear All
                </button>
                <Button variant="primary" size="sm" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Quick Filter Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {QUICK_FILTER_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setQuickTab(value); setPage(1); }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all duration-150 -mb-px',
              quickTab === value
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
            )}
          >
            {label}
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-xs font-semibold',
                quickTab === value
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {value === 'all'
                ? tabCounts['all']
                : tabCounts[value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Bulk Action Bar ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
          <span className="text-sm font-medium text-indigo-700">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <Button variant="secondary" size="sm" leftIcon={<Download size={13} />}>
            Export Selected
          </Button>
          <Button variant="danger" size="sm" leftIcon={<RotateCcw size={13} />}>
            Bulk Refund
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-slate-500 hover:text-slate-800 ml-1"
          >
            Deselect all
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {/* Checkbox */}
                <th className="w-10 px-4 py-3 text-left">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {allPageSelected ? (
                      <CheckSquare size={15} className="text-indigo-500" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>

                {/* Transaction ID */}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[130px]">
                  Transaction ID
                </th>

                {/* Customer */}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[180px]">
                  Customer
                </th>

                {/* Amount - sortable */}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[120px]">
                  <button
                    onClick={() => toggleSort('amount')}
                    className="inline-flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                  >
                    Amount
                    <SortIcon field="amount" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>

                {/* Method */}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[110px]">
                  Method
                </th>

                {/* Gateway */}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[110px]">
                  Gateway
                </th>

                {/* Status - sortable */}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[110px]">
                  <button
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                  >
                    Status
                    <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>

                {/* Created At - sortable */}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[140px]">
                  <button
                    onClick={() => toggleSort('createdAt')}
                    className="inline-flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                  >
                    Created At
                    <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>

                {/* Actions */}
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-[80px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <AlertCircle size={22} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">No transactions found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((txn) => (
                  <TransactionRow
                    key={txn.id}
                    txn={txn}
                    selected={selected.has(txn.id)}
                    onToggleSelect={() => toggleSelect(txn.id)}
                    onView={() => setDetailTxn(txn)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Pagination ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Info + per page */}
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>
            Showing{' '}
            <span className="font-medium text-slate-700">
              {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + perPage, filtered.length)}
            </span>{' '}
            of <span className="font-medium text-slate-700">{filtered.length}</span> transactions
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Per page:</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="h-8 px-2 text-xs rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Page nav */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('…');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '…' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-all duration-150',
                      safePage === p
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            iconOnly
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </Button>

          {/* Jump to page */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-slate-400">Go to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpTo}
              onChange={(e) => setJumpTo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = parseInt(jumpTo);
                  if (!isNaN(n)) { setPage(Math.min(Math.max(1, n), totalPages)); setJumpTo(''); }
                }
              }}
              placeholder="—"
              className="w-12 h-8 px-2 text-xs text-center rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>
      </div>

      {/* ── Transaction Detail Slide-over ── */}
      <TransactionDetailPanel
        txn={detailTxn}
        onClose={() => setDetailTxn(null)}
      />

      {/* ── Export Modal ── */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        totalCount={transactions.length}
        filteredCount={filtered.length}
        selectedCount={selected.size}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Row (memoised)
// ─────────────────────────────────────────────────────────────────────────────

const TransactionRow = React.memo(function TransactionRow({
  txn,
  selected,
  onToggleSelect,
  onView,
}: {
  txn: Transaction;
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(txn.id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [txn.id]
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <tr
      className={cn(
        'group transition-colors duration-100',
        selected ? 'bg-indigo-50/60' : 'hover:bg-slate-50/70',
        'cursor-pointer'
      )}
      onClick={onView}
    >
      {/* Checkbox */}
      <td className="w-10 px-4 py-3" onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}>
        <div className="text-slate-400 hover:text-indigo-600 transition-colors">
          {selected ? (
            <CheckSquare size={15} className="text-indigo-500" />
          ) : (
            <Square size={15} />
          )}
        </div>
      </td>

      {/* Transaction ID */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-slate-700 truncate max-w-[100px]" title={txn.id}>
            {txn.id}
          </span>
          <button
            onClick={handleCopyId}
            title="Copy ID"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600"
          >
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          </button>
        </div>
      </td>

      {/* Customer */}
      <td className="px-3 py-3">
        <p className="text-xs text-slate-700 truncate max-w-[160px]">{txn.customerEmail ?? '—'}</p>
        {txn.customerPhone && (
          <p className="text-xs text-slate-400 mt-0.5">{txn.customerPhone}</p>
        )}
      </td>

      {/* Amount */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-900 text-sm">{formatCurrency(txn.amount, txn.currency)}</span>
          <span className="text-xs font-medium text-slate-400 border border-slate-200 rounded px-1 bg-slate-50">
            {txn.currency}
          </span>
        </div>
      </td>

      {/* Payment Method */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="text-slate-400">{getPaymentMethodIcon(txn.paymentMethod ?? '')}</span>
          <span className="text-xs">{getPaymentMethodLabel(txn.paymentMethod ?? '')}</span>
        </div>
      </td>

      {/* Gateway */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              GATEWAY_COLORS[txn.gateway] ?? 'bg-slate-400'
            )}
          />
          <span className="text-xs text-slate-700">{txn.gateway}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <Badge variant={statusToBadgeVariant(txn.status)} size="sm" dot>
          {statusLabel(txn.status)}
        </Badge>
      </td>

      {/* Created At */}
      <td className="px-3 py-3">
        <p className="text-xs text-slate-700">{formatDate(txn.createdAt)}</p>
        <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(txn.createdAt)}</p>
      </td>

      {/* Actions */}
      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex items-center justify-end gap-1" ref={menuRef}>
          <button
            onClick={onView}
            title="View details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
          >
            <Eye size={14} />
          </button>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={14} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 text-sm">
                <button
                  onClick={() => { navigator.clipboard.writeText(txn.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                >
                  <Copy size={13} />
                  Copy ID
                </button>
                <button
                  onClick={() => { onView(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                >
                  <Eye size={13} />
                  View Details
                </button>
                {txn.status === 'CAPTURED' && (
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-500 hover:bg-rose-50"
                  >
                    <RotateCcw size={13} />
                    Refund
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
});
