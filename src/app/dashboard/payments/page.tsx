'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Copy,
  QrCode,
  ExternalLink,
  Filter,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Link2,
  IndianRupee,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';

import { cn, formatCurrency, formatDate, generateId } from '@/lib/utils';
import type { Transaction } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, paymentStatusVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { Select } from '@/components/ui/select';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ModalStep = 'form' | 'loading' | 'success';

interface CreatePaymentForm {
  amount: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  gateway: string;
  expiry: string;
}

const defaultForm: CreatePaymentForm = {
  amount: '',
  currency: 'INR',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  description: '',
  gateway: 'AUTO',
  expiry: '30m',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getMethodBadge(method?: string) {
  const m = method?.toLowerCase() ?? '';
  const map: Record<string, { label: string; className: string }> = {
    upi:        { label: 'UPI',        className: 'bg-violet-100 text-violet-700' },
    card:       { label: 'Card',       className: 'bg-blue-100 text-blue-700' },
    netbanking: { label: 'Net Banking', className: 'bg-cyan-100 text-cyan-700' },
    wallet:     { label: 'Wallet',     className: 'bg-rose-100 text-rose-700' },
  };
  return map[m] ?? { label: method ?? 'Unknown', className: 'bg-slate-100 text-slate-600' };
}

function getGatewayBadge(gateway: string) {
  const map: Record<string, { label: string; className: string }> = {
    RAZORPAY: { label: 'Razorpay', className: 'bg-indigo-100 text-indigo-700' },
    CASHFREE:  { label: 'Cashfree',  className: 'bg-emerald-100 text-emerald-700' },
    STRIPE:   { label: 'Stripe',   className: 'bg-purple-100 text-purple-700' },
    AUTO:     { label: 'Auto',     className: 'bg-amber-100 text-amber-700' },
  };
  return map[gateway] ?? { label: gateway, className: 'bg-slate-100 text-slate-600' };
}

function statusToVariant(status: string) {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'pending' | 'default'> = {
    CAPTURED:           'success',
    SUCCESS:            'success',
    FAILED:             'error',
    REFUNDED:           'warning',
    PARTIALLY_REFUNDED: 'warning',
    PENDING:            'pending',
    AUTHORIZED:         'info',
  };
  return map[status] ?? 'default';
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini stat card
// ─────────────────────────────────────────────────────────────────────────────

interface MiniStatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}

function MiniStatCard({ label, value, icon, iconBg, trend }: MiniStatCardProps) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
            {trend && (
              <p className="text-xs text-slate-500 mt-1">{trend}</p>
            )}
          </div>
          <div className={cn('shrink-0 w-11 h-11 rounded-xl flex items-center justify-center', iconBg)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy button
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded text-slate-400',
        'hover:bg-slate-100 hover:text-slate-600 transition-colors duration-150',
        className
      )}
      title="Copy"
    >
      {copied ? <Check size={12} className="text-teal-500" /> : <Copy size={12} />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gateway radio option
// ─────────────────────────────────────────────────────────────────────────────

interface GatewayOptionProps {
  id: string;
  value: string;
  label: string;
  sublabel: string;
  badge?: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

function GatewayOption({ id, value, label, sublabel, badge, selected, onSelect }: GatewayOptionProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150',
        selected
          ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      )}
    >
      <input
        id={id}
        type="radio"
        name="gateway"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <div
        className={cn(
          'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
        )}
      >
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{label}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-700">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{sublabel}</p>
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function PaymentsPage() {
  // ── Remote data ─────────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetchTick, setFetchTick] = useState(0);

  useEffect(() => {
    fetch('/api/v1/transactions?limit=200', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => { if (json.success) setTransactions(json.data ?? []); })
      .catch(() => {});
  }, [fetchTick]);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('form');
  const [form, setForm] = useState<CreatePaymentForm>(defaultForm);
  const [generatedLink, setGeneratedLink] = useState('');

  // ── Detail menu state ───────────────────────────────────────────────────────
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Filtering + pagination
  // ─────────────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return transactions.filter((txn) => {
      if (statusFilter !== 'ALL' && txn.status !== statusFilter) return false;
      if (gatewayFilter !== 'ALL' && txn.gateway !== gatewayFilter) return false;
      if (dateFrom && txn.createdAt < dateFrom) return false;
      if (dateTo && txn.createdAt > dateTo + 'T23:59:59') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = txn.id.toLowerCase().includes(q);
        const matchEmail = txn.customerEmail?.toLowerCase().includes(q) ?? false;
        const matchPhone = txn.customerPhone?.toLowerCase().includes(q) ?? false;
        const matchOrder = (txn.metadata?.orderId as string | undefined)?.toLowerCase().includes(q) ?? false;
        if (!matchId && !matchEmail && !matchPhone && !matchOrder) return false;
      }
      return true;
    });
  }, [transactions, statusFilter, gatewayFilter, dateFrom, dateTo, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = () => setCurrentPage(1);

  // ─────────────────────────────────────────────────────────────────────────
  // Modal handlers
  // ─────────────────────────────────────────────────────────────────────────

  const openModal = () => {
    setForm(defaultForm);
    setModalStep('form');
    setGeneratedLink('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (field: keyof CreatePaymentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreatePayment = async () => {
    setModalStep('loading');
    try {
      const amountPaise = Math.round(parseFloat(form.amount) * 100);
      const res = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: amountPaise,
          currency: form.currency,
          customer: {
            email: form.customerEmail || undefined,
            phone: form.customerPhone || undefined,
            name:  form.customerName  || undefined,
          },
          gateway_preference: form.gateway || 'AUTO',
          metadata: form.description ? { description: form.description } : undefined,
          idempotency_key: generateId('idem'),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedLink(json.data.payment_url ?? `${window.location.origin}/checkout/${json.data.transaction_id}`);
        setModalStep('success');
        setFetchTick((t) => t + 1);
      } else {
        setModalStep('form');
        alert(json.error?.message ?? 'Failed to create payment');
      }
    } catch {
      setModalStep('form');
      alert('Network error — please try again');
    }
  };

  const isFormValid =
    form.amount.trim() !== '' &&
    parseFloat(form.amount) > 0 &&
    form.customerName.trim() !== '' &&
    form.customerEmail.trim() !== '';

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
            <p className="text-sm text-slate-500 mt-0.5">Create and manage payment links</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={openModal}
            className="self-start sm:self-auto shadow-indigo-200"
          >
            Create Payment
          </Button>
        </div>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <MiniStatCard
            label="Today's Collections"
            value="₹1,24,500"
            icon={<IndianRupee size={20} className="text-indigo-600" />}
            iconBg="bg-indigo-100"
            trend="↑ 14.2% vs yesterday"
          />
          <MiniStatCard
            label="Active Payment Links"
            value="23"
            icon={<Link2 size={20} className="text-teal-600" />}
            iconBg="bg-teal-100"
            trend="18 expire today"
          />
          <MiniStatCard
            label="Expired Links"
            value="5"
            icon={<Clock size={20} className="text-amber-600" />}
            iconBg="bg-amber-100"
            trend="Last 24 hours"
          />
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search by ID, email, phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleFilterChange();
                    }}
                    leftIcon={<Search size={15} />}
                  />
                </div>

                {/* Status */}
                <div className="w-40">
                  <Select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      handleFilterChange();
                    }}
                    options={[
                      { value: 'ALL',                label: 'All Statuses' },
                      { value: 'PENDING',             label: 'Pending' },
                      { value: 'CAPTURED',            label: 'Captured' },
                      { value: 'FAILED',              label: 'Failed' },
                      { value: 'REFUNDED',            label: 'Refunded' },
                      { value: 'PARTIALLY_REFUNDED',  label: 'Part. Refunded' },
                      { value: 'AUTHORIZED',          label: 'Authorized' },
                    ]}
                  />
                </div>

                {/* Gateway */}
                <div className="w-36">
                  <Select
                    value={gatewayFilter}
                    onChange={(e) => {
                      setGatewayFilter(e.target.value);
                      handleFilterChange();
                    }}
                    options={[
                      { value: 'ALL',      label: 'All Gateways' },
                      { value: 'RAZORPAY', label: 'Razorpay' },
                      { value: 'CASHFREE', label: 'Cashfree' },
                      { value: 'STRIPE',   label: 'Stripe' },
                    ]}
                  />
                </div>

                {/* Export */}
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<Download size={15} />}
                >
                  Export CSV
                </Button>
              </div>

              {/* Date range row */}
              <div className="flex flex-wrap items-center gap-3">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 font-medium">Date range:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    handleFilterChange();
                  }}
                  className={cn(
                    'h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                    'hover:border-slate-300 transition-colors'
                  )}
                />
                <span className="text-slate-400 text-sm">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    handleFilterChange();
                  }}
                  className={cn(
                    'h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                    'hover:border-slate-300 transition-colors'
                  )}
                />
                {(dateFrom || dateTo || searchQuery || statusFilter !== 'ALL' || gatewayFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setGatewayFilter('ALL');
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    <X size={12} /> Clear filters
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Payments Table ──────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <CardHeader className="p-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Payment Transactions
              </CardTitle>
              <span className="text-xs text-slate-500 font-medium">
                {filtered.length} results
              </span>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    Payment ID
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    Customer
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    Amount
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    Method
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    Gateway
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <AlertCircle size={22} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No transactions found</p>
                        <p className="text-xs text-slate-400">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((txn) => {
                    const methodBadge = getMethodBadge(txn.paymentMethod);
                    const gatewayBadge = getGatewayBadge(txn.gateway);
                    const statusVariant = statusToVariant(txn.status);
                    const isMenuOpen = openMenuId === txn.id;

                    return (
                      <tr
                        key={txn.id}
                        className="hover:bg-indigo-50/30 transition-colors duration-100 group"
                      >
                        {/* Payment ID */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-slate-700 font-medium">
                              {txn.id.slice(0, 14)}…
                            </span>
                            <CopyButton text={txn.id} />
                          </div>
                          {txn.gatewayPaymentId && (
                            <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                              {txn.gatewayPaymentId.slice(0, 16)}…
                            </p>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-3.5">
                          <p className="text-slate-900 font-medium text-xs">
                            {txn.customerEmail?.split('@')[0] ?? '—'}
                          </p>
                          <p className="text-[11px] text-slate-400">{txn.customerEmail}</p>
                          {txn.customerPhone && (
                            <p className="text-[11px] text-slate-400">{txn.customerPhone}</p>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(txn.amount, txn.currency)}
                          </span>
                          <p className="text-[10px] text-slate-400">{txn.currency}</p>
                        </td>

                        {/* Method */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              methodBadge.className
                            )}
                          >
                            {methodBadge.label}
                          </span>
                        </td>

                        {/* Gateway */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              gatewayBadge.className
                            )}
                          >
                            {gatewayBadge.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Badge variant={statusVariant} dot size="sm">
                            {txn.status.replace('_', ' ')}
                          </Badge>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-xs text-slate-600">
                            {formatDate(txn.createdAt)}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50',
                                'transition-colors duration-150'
                              )}
                              title="View details"
                            >
                              <Eye size={15} />
                            </button>

                            {/* More menu */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(isMenuOpen ? null : txn.id)}
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center',
                                  'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
                                  'transition-colors duration-150'
                                )}
                                title="More actions"
                              >
                                <MoreVertical size={15} />
                              </button>

                              {isMenuOpen && (
                                <>
                                  {/* Click-away overlay */}
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-9 z-20 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 text-xs">
                                    <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                                      <ExternalLink size={13} className="text-slate-400" />
                                      View in Gateway
                                    </button>
                                    <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                                      <Copy size={13} className="text-slate-400" />
                                      Copy Payment ID
                                    </button>
                                    <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                                      <CreditCard size={13} className="text-slate-400" />
                                      Issue Refund
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors">
                                      <AlertCircle size={13} className="text-rose-400" />
                                      Flag Transaction
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">{filtered.length}</span>{' '}
                payments
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-150',
                    safePage === 1
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-white'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 bg-white'
                  )}
                >
                  <ChevronLeft size={15} />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (safePage <= 4) {
                    page = i + 1;
                  } else if (safePage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = safePage - 3 + i;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium border transition-all duration-150',
                        page === safePage
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-200'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                      )}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-150',
                    safePage === totalPages
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-white'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 bg-white'
                  )}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Create Payment Modal ─────────────────────────────────────────────── */}
      <Modal open={isModalOpen} onClose={closeModal} size="lg">

        {/* FORM STEP */}
        {modalStep === 'form' && (
          <>
            <ModalHeader onClose={closeModal}>
              <ModalTitle>Create Payment Link</ModalTitle>
              <p className="text-sm text-slate-500 mt-1">
                Generate a secure payment link to share with your customer.
              </p>
            </ModalHeader>

            <ModalBody className="space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Amount + Currency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Amount <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-500 text-sm font-medium pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => handleFormChange('amount', e.target.value)}
                      className={cn(
                        'w-full h-10 pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                        'hover:border-slate-300 transition-all duration-150',
                        'placeholder:text-slate-400'
                      )}
                    />
                  </div>
                </div>
                <div>
                  <Select
                    label="Currency"
                    value={form.currency}
                    onChange={(e) => handleFormChange('currency', e.target.value)}
                    options={[
                      { value: 'INR', label: 'INR' },
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' },
                    ]}
                  />
                </div>
              </div>

              {/* Customer info */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Customer Details
                </h3>
                <Input
                  label="Customer Name *"
                  placeholder="Arjun Sharma"
                  value={form.customerName}
                  onChange={(e) => handleFormChange('customerName', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Email *"
                    type="email"
                    placeholder="customer@example.com"
                    value={form.customerEmail}
                    onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.customerPhone}
                    onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description / Order Reference
                </label>
                <input
                  type="text"
                  placeholder="Invoice #INV-2024-001 or product description"
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className={cn(
                    'w-full h-10 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                    'hover:border-slate-300 transition-all duration-150 placeholder:text-slate-400'
                  )}
                />
              </div>

              {/* Gateway selection */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Payment Gateway
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <GatewayOption
                    id="gw-auto"
                    value="AUTO"
                    label="Auto Route"
                    sublabel="Best gateway selected automatically"
                    badge="Recommended"
                    selected={form.gateway === 'AUTO'}
                    onSelect={(v) => handleFormChange('gateway', v)}
                  />
                  <GatewayOption
                    id="gw-razorpay"
                    value="RAZORPAY"
                    label="Razorpay"
                    sublabel="UPI, Card, Netbanking, Wallets"
                    selected={form.gateway === 'RAZORPAY'}
                    onSelect={(v) => handleFormChange('gateway', v)}
                  />
                  <GatewayOption
                    id="gw-cashfree"
                    value="CASHFREE"
                    label="Cashfree"
                    sublabel="UPI, Card, EMI, Paylater"
                    selected={form.gateway === 'CASHFREE'}
                    onSelect={(v) => handleFormChange('gateway', v)}
                  />
                  <GatewayOption
                    id="gw-stripe"
                    value="STRIPE"
                    label="Stripe"
                    sublabel="International cards & wallets"
                    selected={form.gateway === 'STRIPE'}
                    onSelect={(v) => handleFormChange('gateway', v)}
                  />
                </div>
              </div>

              {/* Expiry */}
              <Select
                label="Link Expiry"
                value={form.expiry}
                onChange={(e) => handleFormChange('expiry', e.target.value)}
                options={[
                  { value: '30m',  label: '30 minutes (default)' },
                  { value: '1h',   label: '1 hour' },
                  { value: '6h',   label: '6 hours' },
                  { value: '24h',  label: '24 hours' },
                  { value: '7d',   label: '7 days' },
                ]}
              />
            </ModalBody>

            <ModalFooter>
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreatePayment}
                disabled={!isFormValid}
                leftIcon={<Link2 size={15} />}
              >
                Create Payment Link
              </Button>
            </ModalFooter>
          </>
        )}

        {/* LOADING STEP */}
        {modalStep === 'loading' && (
          <ModalBody className="flex flex-col items-center justify-center py-16 gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">Creating payment link…</p>
              <p className="text-sm text-slate-500 mt-1">Routing through {form.gateway === 'AUTO' ? 'best gateway' : form.gateway}</p>
            </div>
          </ModalBody>
        )}

        {/* SUCCESS STEP */}
        {modalStep === 'success' && (
          <>
            <ModalHeader onClose={closeModal}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <Check size={18} className="text-teal-600" />
                </div>
                <div>
                  <ModalTitle>Payment Link Created!</ModalTitle>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Share this link with {form.customerName || 'your customer'}
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-5">
              {/* Link display */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-xs font-medium text-indigo-600 mb-2 uppercase tracking-wide">
                  Payment Link
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-sm text-indigo-900 break-all">
                    {generatedLink}
                  </span>
                  <CopyButton text={generatedLink} className="w-8 h-8 rounded-lg hover:bg-indigo-100 text-indigo-500" />
                </div>
              </div>

              {/* Details row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    ₹{parseFloat(form.amount || '0').toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Gateway</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{form.gateway}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Expires in</p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {form.expiry === '30m' ? '30 min' : form.expiry === '1h' ? '1 hr' : form.expiry === '6h' ? '6 hr' : form.expiry === '24h' ? '24 hr' : '7 days'}
                  </p>
                </div>
              </div>

              {/* QR Code placeholder */}
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  'w-40 h-40 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50',
                  'flex flex-col items-center justify-center gap-2 text-indigo-400'
                )}>
                  <QrCode size={36} />
                  <span className="text-xs font-medium">QR Code</span>
                </div>
                <p className="text-xs text-slate-500">Scan to pay instantly</p>
              </div>

              {/* Share actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<ExternalLink size={15} />}
                >
                  Share via Email
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<Copy size={15} />}
                  onClick={() => navigator.clipboard.writeText(generatedLink).catch(() => {})}
                >
                  Copy Link
                </Button>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="secondary" onClick={closeModal}>
                Close
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setForm(defaultForm);
                  setModalStep('form');
                  setGeneratedLink('');
                }}
                leftIcon={<Plus size={15} />}
              >
                Create Another
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}
