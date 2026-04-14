'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Send,
  Upload,
  FileSpreadsheet,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
  Banknote,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  formatCurrency,
  formatDate,
  maskAccountNumber,
  getStatusColor,
} from '@/lib/utils';
import { mockPayouts } from '@/lib/mock-data';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Select } from '@/components/ui/select';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

type TabId = 'all' | 'single' | 'bulk' | 'failed';
type PayoutStatus = 'ALL' | 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'PERMANENTLY_FAILED';
type PayoutMode = 'ALL' | 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All Payouts' },
  { id: 'single', label: 'Single' },
  { id: 'bulk', label: 'Bulk Batches' },
  { id: 'failed', label: 'Failed' },
];

const STATUS_OPTIONS: { value: PayoutStatus; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PERMANENTLY_FAILED', label: 'Permanently Failed' },
];

const MODE_OPTIONS: { value: PayoutMode; label: string }[] = [
  { value: 'ALL', label: 'All Modes' },
  { value: 'IMPS', label: 'IMPS' },
  { value: 'NEFT', label: 'NEFT' },
  { value: 'RTGS', label: 'RTGS' },
  { value: 'UPI', label: 'UPI' },
];

const MODE_COLORS: Record<string, string> = {
  IMPS: 'bg-violet-100 text-violet-700',
  NEFT: 'bg-blue-100 text-blue-700',
  RTGS: 'bg-amber-100 text-amber-700',
  UPI:  'bg-emerald-100 text-emerald-700',
};

const PAGE_SIZE = 7;

// Mock CSV preview data for bulk upload
const MOCK_CSV_ROWS = [
  { name: 'Suresh Kumar Traders', account: '3501234567890', ifsc: 'HDFC0001234', amount: '45000', mode: 'IMPS', status: 'valid' },
  { name: 'Laxmi Enterprise', account: '6501987654321', ifsc: 'ICIC0002345', amount: '28500', mode: 'NEFT', status: 'valid' },
  { name: 'Pradeep Auto Parts', account: '2001123456789', ifsc: 'SBIN0003456', amount: '12750', mode: 'IMPS', status: 'valid' },
  { name: 'Ananya Fashion House', account: '9181234567890', ifsc: 'UTIB0004567', amount: '67000', mode: 'RTGS', status: 'valid' },
  { name: 'Invalid Entry Corp', account: '123', ifsc: 'BADIFSC', amount: 'abc', mode: 'NEFT', status: 'error', error: 'Invalid account number & amount' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  bgClass,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={cn('p-2.5 rounded-xl', bgClass)}>
        <Icon size={20} className={iconClass} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Payout Modal
// ─────────────────────────────────────────────────────────────────────────────

interface SinglePayoutModalProps {
  open: boolean;
  onClose: () => void;
}

function SinglePayoutModal({ open, onClose }: SinglePayoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=form, 2=review, 3=success
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    beneficiaryName: '',
    accountNumber: '',
    confirmAccount: '',
    ifscCode: '',
    amount: '',
    mode: 'IMPS',
    narration: '',
    scheduled: false,
    scheduledAt: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setStep(1);
    setLoading(false);
    setForm({
      beneficiaryName: '',
      accountNumber: '',
      confirmAccount: '',
      ifscCode: '',
      amount: '',
      mode: 'IMPS',
      narration: '',
      scheduled: false,
      scheduledAt: '',
    });
    setErrors({});
    onClose();
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.beneficiaryName.trim()) e.beneficiaryName = 'Beneficiary name is required';
    if (!form.accountNumber.trim()) e.accountNumber = 'Account number is required';
    else if (form.accountNumber.length < 9) e.accountNumber = 'Account number must be at least 9 digits';
    if (form.accountNumber !== form.confirmAccount) e.confirmAccount = 'Account numbers do not match';
    if (!form.ifscCode.trim()) e.ifscCode = 'IFSC code is required';
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.toUpperCase())) e.ifscCode = 'Invalid IFSC format (e.g., HDFC0001234)';
    if (!form.amount.trim()) e.amount = 'Amount is required';
    else if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (form.scheduled && !form.scheduledAt) e.scheduledAt = 'Please select a schedule time';
    return e;
  };

  const handleReview = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(2);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setStep(3);
  };

  const modeDescriptions: Record<string, string> = {
    IMPS: 'Instant transfer, 24×7, up to ₹5L',
    NEFT: 'Batch settlement, within 2 hrs',
    UPI:  'Instant VPA-based transfer',
  };

  return (
    <Modal open={open} onClose={handleClose} size="lg" closeOnBackdrop={step !== 3}>
      <ModalHeader onClose={handleClose}>
        <ModalTitle>
          {step === 1 && 'New Single Payout'}
          {step === 2 && 'Review Payout Details'}
          {step === 3 && 'Payout Initiated'}
        </ModalTitle>
        <ModalDescription>
          {step === 1 && 'Transfer funds directly to a bank account or UPI handle'}
          {step === 2 && 'Please review before confirming. This action cannot be undone.'}
          {step === 3 && 'Your payout has been queued for processing'}
        </ModalDescription>
      </ModalHeader>

      {/* Step indicator */}
      {step !== 3 && (
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all',
                    step >= s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  )}
                >
                  {s}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    step >= s ? 'text-indigo-600' : 'text-slate-400'
                  )}
                >
                  {s === 1 ? 'Enter Details' : 'Review & Confirm'}
                </span>
                {s < 2 && <div className={cn('flex-1 h-px', step > s ? 'bg-indigo-300' : 'bg-slate-200')} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <ModalBody className="space-y-5 max-h-[60vh] overflow-y-auto">
        {/* ── Step 1: Form ── */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Beneficiary Name"
                placeholder="e.g., Suresh Kumar Traders"
                value={form.beneficiaryName}
                onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                error={errors.beneficiaryName}
                containerClassName="col-span-2"
              />
              <Input
                label="Account Number"
                placeholder="Enter account number"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                error={errors.accountNumber}
              />
              <Input
                label="Confirm Account Number"
                placeholder="Re-enter account number"
                value={form.confirmAccount}
                onChange={(e) => setForm({ ...form, confirmAccount: e.target.value })}
                error={errors.confirmAccount}
              />
              <Input
                label="IFSC Code"
                placeholder="e.g., HDFC0001234"
                value={form.ifscCode}
                onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                error={errors.ifscCode}
                helperText={!errors.ifscCode ? '11 characters, e.g., HDFC0001234' : undefined}
              />
              <Input
                label="Amount (₹)"
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                error={errors.amount}
                leftIcon={<span className="text-slate-500 text-sm font-medium">₹</span>}
              />
            </div>

            {/* Transfer Mode */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Transfer Mode</p>
              <div className="grid grid-cols-3 gap-3">
                {(['IMPS', 'NEFT', 'UPI'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, mode: m })}
                    className={cn(
                      'border-2 rounded-xl p-3 text-left transition-all duration-150',
                      form.mode === m
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <p className={cn('text-sm font-semibold', form.mode === m ? 'text-indigo-700' : 'text-slate-700')}>
                      {m}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{modeDescriptions[m]}</p>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Reference / Narration"
              placeholder="Optional — appears in bank statement"
              value={form.narration}
              onChange={(e) => setForm({ ...form, narration: e.target.value })}
            />

            {/* Schedule toggle */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.scheduled}
                  onChange={(e) => setForm({ ...form, scheduled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Schedule for later
                </span>
              </label>
              {form.scheduled && (
                <Input
                  type="datetime-local"
                  label="Scheduled Date & Time"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  error={errors.scheduledAt}
                />
              )}
            </div>
          </>
        )}

        {/* ── Step 2: Review ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Beneficiary</span>
                <span className="text-sm font-semibold text-slate-900">{form.beneficiaryName}</span>
              </div>
              <div className="border-t border-indigo-100/80 pt-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">Account Number</span>
                <span className="text-sm font-mono font-medium text-slate-700">
                  {maskAccountNumber(form.accountNumber)}
                </span>
              </div>
              <div className="border-t border-indigo-100/80 pt-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">IFSC Code</span>
                <span className="text-sm font-mono font-medium text-slate-700">{form.ifscCode}</span>
              </div>
              <div className="border-t border-indigo-100/80 pt-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">Transfer Mode</span>
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', MODE_COLORS[form.mode])}>
                  {form.mode}
                </span>
              </div>
              {form.narration && (
                <div className="border-t border-indigo-100/80 pt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Narration</span>
                  <span className="text-sm text-slate-700">{form.narration}</span>
                </div>
              )}
              {form.scheduled && form.scheduledAt && (
                <div className="border-t border-indigo-100/80 pt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Scheduled At</span>
                  <span className="text-sm text-slate-700">
                    {new Date(form.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}
              <div className="border-t border-indigo-200 pt-3 flex items-center justify-between">
                <span className="text-base font-semibold text-slate-700">Amount</span>
                <span className="text-xl font-bold text-indigo-700">
                  ₹{Number(form.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <AlertCircle size={12} className="text-amber-500" />
              Funds will be debited from your settlement account. This action cannot be reversed once processed.
            </p>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Payout Queued Successfully</h3>
              <p className="text-sm text-slate-500 mt-1">
                Your payout to <strong>{form.beneficiaryName}</strong> of{' '}
                <strong>₹{Number(form.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> via{' '}
                <strong>{form.mode}</strong> has been queued.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 w-full text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Reference ID</span>
                <span className="font-mono font-medium text-slate-800">pay_out_{Math.random().toString(36).slice(2, 10)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Estimated time</span>
                <span className="text-slate-700">
                  {form.mode === 'IMPS' || form.mode === 'UPI' ? 'Instant (< 2 min)' : '1–2 business hours'}
                </span>
              </div>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {step === 1 && (
          <>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleReview} rightIcon={<ArrowRight size={16} />}>
              Review
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ChevronLeft size={16} />}>
              Back
            </Button>
            <Button variant="primary" onClick={handleConfirm} loading={loading} leftIcon={<Send size={16} />}>
              Confirm & Send
            </Button>
          </>
        )}
        {step === 3 && (
          <Button variant="primary" onClick={handleClose} fullWidth>
            Done
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Upload Modal
// ─────────────────────────────────────────────────────────────────────────────

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
}

function BulkUploadModal({ open, onClose }: BulkUploadModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1=upload, 2=preview, 3=confirm, 4=success
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setDragging(false);
    setProcessing(false);
    onClose();
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) setFile(droppedFile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleProcessConfirm = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2200));
    setProcessing(false);
    setStep(4);
  };

  const validCount = MOCK_CSV_ROWS.filter((r) => r.status === 'valid').length;
  const errorCount = MOCK_CSV_ROWS.filter((r) => r.status === 'error').length;
  const totalAmount = MOCK_CSV_ROWS.filter((r) => r.status === 'valid')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const batchId = `BP-${Math.floor(2000 + Math.random() * 999)}`;

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader onClose={handleClose}>
        <ModalTitle>
          {step === 1 && 'Bulk Payout Upload'}
          {step === 2 && 'Preview & Validate'}
          {step === 3 && 'Confirm Bulk Processing'}
          {step === 4 && 'Batch Queued'}
        </ModalTitle>
        <ModalDescription>
          {step === 1 && 'Upload a CSV file to disburse multiple payouts at once'}
          {step === 2 && 'Review parsed entries and fix errors before proceeding'}
          {step === 3 && 'Confirm to submit this batch for processing'}
          {step === 4 && 'Your bulk payout batch has been queued successfully'}
        </ModalDescription>
      </ModalHeader>

      {/* Step indicator */}
      {step !== 4 && (
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1">
            {[
              { n: 1, label: 'Upload' },
              { n: 2, label: 'Preview' },
              { n: 3, label: 'Confirm' },
            ].map((s, idx) => (
              <React.Fragment key={s.n}>
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                      step >= s.n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                    )}
                  >
                    {step > s.n ? <CheckCircle size={14} /> : s.n}
                  </div>
                  <span className={cn('text-xs font-medium', step >= s.n ? 'text-indigo-600' : 'text-slate-400')}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && <div className={cn('flex-1 h-px mx-1', step > s.n ? 'bg-indigo-300' : 'bg-slate-200')} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <ModalBody className="max-h-[60vh] overflow-y-auto">
        {/* ── Step 1: Upload ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer',
                dragging
                  ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
                  : file
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50 bg-white'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              {file ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <FileText size={24} className="text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<X size={14} />}
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <FileSpreadsheet size={28} className="text-indigo-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      {dragging ? 'Release to upload' : 'Drop CSV file here or click to browse'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Accepted: .csv — Max size: 5 MB</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center gap-2">
                <Download size={16} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Need a template?</p>
                  <p className="text-xs text-amber-600">Download our standard CSV format with headers</p>
                </div>
              </div>
              <button className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 whitespace-nowrap">
                Download Template
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-600 mb-2">Required CSV Columns:</p>
              <div className="grid grid-cols-2 gap-1">
                {['beneficiary_name', 'account_number', 'ifsc_code', 'amount', 'mode', 'narration (optional)'].map((col) => (
                  <span key={col} className="font-mono bg-white border border-slate-200 rounded px-2 py-0.5">{col}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                  <CheckCircle size={12} /> {validCount} valid
                </span>
                {errorCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                    <AlertCircle size={12} /> {errorCount} error{errorCount > 1 ? 's' : ''} found
                  </span>
                )}
              </div>
              {errorCount > 0 && (
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 underline underline-offset-2">
                  <Download size={12} /> Download Error Report
                </button>
              )}
            </div>

            {/* CSV preview table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['#', 'Beneficiary', 'Account', 'IFSC', 'Amount', 'Mode', 'Status'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CSV_ROWS.map((row, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        'border-b border-slate-100 last:border-0',
                        row.status === 'error' ? 'bg-red-50' : 'bg-white hover:bg-slate-50'
                      )}
                    >
                      <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-800 max-w-[120px] truncate">{row.name}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{row.account.slice(-4).padStart(row.account.length, '*')}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{row.ifsc}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">₹{Number(row.amount).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2">
                        <span className={cn('px-2 py-0.5 rounded-full font-medium text-[10px]', MODE_COLORS[row.mode] ?? 'bg-slate-100 text-slate-600')}>{row.mode}</span>
                      </td>
                      <td className="px-3 py-2">
                        {row.status === 'valid' ? (
                          <CheckCircle size={14} className="text-emerald-500" />
                        ) : (
                          <span className="text-red-600 font-medium" title={row.error}>
                            <AlertCircle size={14} className="inline mr-1" />
                            {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold text-indigo-800">{validCount} valid payouts</span>
                <span className="text-indigo-500 ml-1">will be processed</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-500">Total Amount</p>
                <p className="text-base font-bold text-indigo-700">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-indigo-700">{validCount}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Total Payouts</p>
                </div>
                <div className="border-x border-indigo-100">
                  <p className="text-xl font-bold text-slate-800">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Total Amount</p>
                </div>
                <div>
                  <p className="text-base font-bold text-amber-600">~30 min</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Est. Processing</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <span className="text-sm text-slate-500">File name</span>
                <span className="text-sm font-medium text-slate-800">{file?.name ?? 'payouts_batch.csv'}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <span className="text-sm text-slate-500">Valid entries</span>
                <span className="text-sm font-semibold text-emerald-600">{validCount} payouts</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <span className="text-sm text-slate-500">Skipped (errors)</span>
                <span className="text-sm font-semibold text-red-500">{errorCount} entries</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 flex items-start gap-1.5">
              <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
              Entries with errors will be skipped. Only valid payouts will be submitted.
              You can re-upload corrected entries separately.
            </p>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center py-6 gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                <FileSpreadsheet size={36} className="text-indigo-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle size={16} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-500 tracking-widest uppercase mb-1">Batch Queued</p>
              <h3 className="text-xl font-bold text-slate-900">Batch #{batchId}</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
                {validCount} payouts totalling{' '}
                <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> have been queued for processing.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 w-full text-left space-y-2 border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Batch ID</span>
                <span className="font-mono font-semibold text-indigo-700">{batchId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Estimated completion</span>
                <span className="text-slate-700">~30 minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Notification</span>
                <span className="text-slate-700">Webhook + Email</span>
              </div>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {step === 1 && (
          <>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!file}
              onClick={() => setStep(2)}
              rightIcon={<ArrowRight size={16} />}
            >
              Preview & Validate
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ChevronLeft size={16} />}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={validCount === 0}
              onClick={() => setStep(3)}
              rightIcon={<ArrowRight size={16} />}
            >
              Proceed to Confirm
            </Button>
          </>
        )}
        {step === 3 && (
          <>
            <Button variant="secondary" onClick={() => setStep(2)} leftIcon={<ChevronLeft size={16} />}>
              Back
            </Button>
            <Button
              variant="primary"
              loading={processing}
              onClick={handleProcessConfirm}
              leftIcon={<Upload size={16} />}
            >
              Process Payouts
            </Button>
          </>
        )}
        {step === 4 && (
          <Button variant="primary" onClick={handleClose} fullWidth>
            Done
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Payout Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

function PayoutDetailModal({
  payout,
  onClose,
}: {
  payout: (typeof mockPayouts)[0] | null;
  onClose: () => void;
}) {
  if (!payout) return null;
  return (
    <Modal open={!!payout} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Payout Details</ModalTitle>
        <ModalDescription>{payout.id}</ModalDescription>
      </ModalHeader>
      <ModalBody className="space-y-3">
        {[
          { label: 'Beneficiary', value: payout.beneficiaryName },
          { label: 'Account', value: maskAccountNumber(payout.accountNumber) },
          { label: 'IFSC Code', value: payout.ifscCode },
          {
            label: 'Amount',
            value: formatCurrency(payout.amount),
            highlight: true,
          },
          { label: 'Mode', value: payout.mode },
          { label: 'Status', value: payout.status },
          ...(payout.batchId ? [{ label: 'Batch ID', value: payout.batchId }] : []),
          ...(payout.gatewayPayoutId ? [{ label: 'Gateway Payout ID', value: payout.gatewayPayoutId }] : []),
          ...(payout.failureReason ? [{ label: 'Failure Reason', value: payout.failureReason, error: true }] : []),
          { label: 'Created At', value: formatDate(payout.createdAt) },
          ...(payout.processedAt ? [{ label: 'Processed At', value: formatDate(payout.processedAt) }] : []),
        ].map(({ label, value, highlight, error }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span
              className={cn(
                'text-sm font-medium text-right max-w-[55%] truncate',
                highlight ? 'text-indigo-700 font-bold text-base' : 'text-slate-800',
                error ? 'text-red-600' : ''
              )}
            >
              {value}
            </span>
          </div>
        ))}
        {payout.retryCount > 0 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-500">Retry Count</span>
            <span className="text-sm font-semibold text-red-600">{payout.retryCount}×</span>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {(payout.status === 'FAILED' || payout.status === 'PERMANENTLY_FAILED') && (
          <Button variant="amber" size="sm" leftIcon={<RefreshCw size={14} />}>
            Retry Payout
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [statusFilter, setStatusFilter] = useState<PayoutStatus>('ALL');
  const [modeFilter, setModeFilter] = useState<PayoutMode>('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<(typeof mockPayouts)[0] | null>(null);

  // ── Filtering logic ───────────────────────────────────────────────────────
  const filtered = mockPayouts.filter((p) => {
    // Tab filter
    if (activeTab === 'single' && p.batchId) return false;
    if (activeTab === 'bulk' && !p.batchId) return false;
    if (activeTab === 'failed' && p.status !== 'FAILED' && p.status !== 'PERMANENTLY_FAILED') return false;

    // Status filter
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

    // Mode filter
    if (modeFilter !== 'ALL' && p.mode !== modeFilter) return false;

    // Date range
    if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(p.createdAt) > new Date(dateTo + 'T23:59:59')) return false;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.beneficiaryName.toLowerCase().includes(q) ||
        p.accountNumber.includes(q) ||
        p.ifscCode.toLowerCase().includes(q) ||
        (p.batchId ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  const handleTabChange = (tab: TabId) => { setActiveTab(tab); setCurrentPage(1); };
  const handleStatusFilter = (v: string) => { setStatusFilter(v as PayoutStatus); setCurrentPage(1); };
  const handleModeFilter = (v: string) => { setModeFilter(v as PayoutMode); setCurrentPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1); };

  // Stats
  const today = new Date().toISOString().slice(0, 10);
  const todayPayouts = mockPayouts.filter((p) => p.createdAt.startsWith(today));
  const todayDisbursed = todayPayouts.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
  const queued = mockPayouts.filter((p) => p.status === 'QUEUED').length;
  const processing = mockPayouts.filter((p) => p.status === 'PROCESSING').length;
  const failed = mockPayouts.filter((p) => p.status === 'FAILED' || p.status === 'PERMANENTLY_FAILED').length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payouts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Disburse payments to vendors and beneficiaries</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Upload size={16} />}
            onClick={() => setShowBulkModal(true)}
          >
            Bulk Upload
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setShowSingleModal(true)}
          >
            Single Payout
          </Button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Disbursed (Today)"
          value={formatCurrency(todayDisbursed || 45_600_000)}
          icon={Banknote}
          iconClass="text-indigo-600"
          bgClass="bg-indigo-100"
        />
        <StatCard
          label="Queued"
          value={`${queued} payouts`}
          icon={Clock}
          iconClass="text-slate-500"
          bgClass="bg-slate-100"
        />
        <StatCard
          label="Processing"
          value={`${processing} payouts`}
          icon={RefreshCw}
          iconClass="text-cyan-600"
          bgClass="bg-cyan-100"
        />
        <StatCard
          label="Failed"
          value={`${failed} payouts`}
          icon={AlertCircle}
          iconClass="text-red-500"
          bgClass="bg-red-100"
        />
      </div>

      {/* ── Tab Navigation ── */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'pb-3 text-sm font-medium transition-all duration-150 relative',
                activeTab === tab.id
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            containerClassName="w-44"
          />
          <Select
            options={MODE_OPTIONS}
            value={modeFilter}
            onChange={(e) => handleModeFilter(e.target.value)}
            containerClassName="w-36"
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              containerClassName="w-40"
            />
            <span className="text-slate-400 text-sm">—</span>
            <Input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              containerClassName="w-40"
            />
          </div>
          <Input
            placeholder="Search by beneficiary, account, reference..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            containerClassName="flex-1 min-w-[220px]"
          />
          {(statusFilter !== 'ALL' || modeFilter !== 'ALL' || dateFrom || dateTo || search) && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X size={14} />}
              onClick={() => {
                setStatusFilter('ALL');
                setModeFilter('ALL');
                setDateFrom('');
                setDateTo('');
                setSearch('');
                setCurrentPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Payout ID', 'Beneficiary', 'IFSC Code', 'Amount', 'Mode', 'Status', 'Retries', 'Date', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText size={28} className="opacity-50" />
                      <p className="text-sm font-medium">No payouts match your filters</p>
                      <p className="text-xs">Try adjusting the filters or search query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((payout) => (
                  <tr
                    key={payout.id}
                    className="hover:bg-slate-50/70 transition-colors duration-100 group"
                  >
                    {/* Payout ID */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-indigo-600 font-medium">
                          {payout.id.slice(0, 18)}…
                        </span>
                        {payout.batchId && (
                          <span className="text-[10px] text-slate-400 mt-0.5">Batch: {payout.batchId}</span>
                        )}
                      </div>
                    </td>

                    {/* Beneficiary */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800 whitespace-nowrap max-w-[160px] truncate">
                          {payout.beneficiaryName}
                        </p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          {maskAccountNumber(payout.accountNumber)}
                        </p>
                      </div>
                    </td>

                    {/* IFSC */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-slate-600">{payout.ifscCode}</span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(payout.amount)}
                      </span>
                    </td>

                    {/* Mode */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap',
                          MODE_COLORS[payout.mode] ?? 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {payout.mode}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap',
                          getStatusColor(payout.status)
                        )}
                      >
                        {payout.status === 'PERMANENTLY_FAILED' ? 'Perm. Failed' : payout.status.charAt(0) + payout.status.slice(1).toLowerCase()}
                      </span>
                    </td>

                    {/* Retry Count */}
                    <td className="px-4 py-3.5 text-center">
                      {payout.retryCount > 0 ? (
                        <span className="text-xs font-bold text-red-500">{payout.retryCount}×</span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(payout.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedPayout(payout)}
                          title="View details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        {(payout.status === 'FAILED' || payout.status === 'PERMANENTLY_FAILED') && (
                          <button
                            title="Retry payout"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <RefreshCw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{filtered.length}</span> payouts
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) + 1 < p) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                        currentPage === p
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Modals ── */}
      <SinglePayoutModal
        open={showSingleModal}
        onClose={() => setShowSingleModal(false)}
      />
      <BulkUploadModal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
      />
      <PayoutDetailModal
        payout={selectedPayout}
        onClose={() => setSelectedPayout(null)}
      />
    </div>
  );
}
