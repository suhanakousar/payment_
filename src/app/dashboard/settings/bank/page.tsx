'use client';

import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Info,
  Clock,
  CreditCard,
  Zap,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { maskAccountNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';

// ─── Types ────────────────────────────────────────────────────────────────────

type AddStep = 'form' | 'penny-drop' | 'success';
type ScheduleKey = 'T+0' | 'T+1' | 'T+2';

// ─── Static data ─────────────────────────────────────────────────────────────

const CURRENT_ACCOUNT = {
  accountNumber: '123456787890',
  holderName: 'Arjun Retail Solutions Pvt. Ltd.',
  ifsc: 'HDFC0001234',
  bankName: 'HDFC Bank',
  branch: 'Andheri East, Mumbai',
};

const SCHEDULE_OPTIONS: { key: ScheduleKey; label: string; badge?: string; disabled?: boolean }[] = [
  { key: 'T+0', label: 'Instant (T+0)', badge: 'Enterprise', disabled: true },
  { key: 'T+1', label: 'Next Business Day (T+1)' },
  { key: 'T+2', label: 'Two Business Days (T+2)' },
];

const IFSC_LOOKUP: Record<string, string> = {
  HDFC0001234: 'HDFC Bank – Andheri East, Mumbai',
  ICIC0002345: 'ICICI Bank – Bandra West, Mumbai',
  SBIN0003456: 'State Bank of India – Fort, Mumbai',
  PUNB0005678: 'Punjab National Bank – Dadar, Mumbai',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BankPage() {
  // Add new account flow
  const [showAddForm, setShowAddForm] = useState(false);
  const [addStep, setAddStep] = useState<AddStep>('form');
  const [addSaving, setAddSaving] = useState(false);
  const [pennySaving, setPennySaving] = useState(false);

  const [newAccount, setNewAccount] = useState({
    holderName: '',
    accountNumber: '',
    confirmAccount: '',
    ifsc: '',
    accountType: 'current',
  });

  const [ifscResolved, setIfscResolved] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [accountError, setAccountError] = useState('');

  // Settlement schedule
  const [schedule, setSchedule] = useState<ScheduleKey>('T+1');
  const [minSettlement, setMinSettlement] = useState('100000');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // Success toast for schedule
  const showScheduleSaved = async () => {
    setScheduleSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setScheduleSaving(false);
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 3000);
  };

  // IFSC lookup
  const handleIfscChange = (value: string) => {
    const upper = value.toUpperCase();
    setNewAccount({ ...newAccount, ifsc: upper });
    setIfscResolved(IFSC_LOOKUP[upper] ?? '');
  };

  // Validate & submit new account
  const handleSubmitAccount = async () => {
    if (newAccount.accountNumber !== newAccount.confirmAccount) {
      setAccountError('Account numbers do not match.');
      return;
    }
    setAccountError('');
    setAddSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setAddSaving(false);
    setAddStep('penny-drop');
  };

  const handlePennyConfirm = async () => {
    setPennySaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setPennySaving(false);
    setAddStep('success');
  };

  const resetAddFlow = () => {
    setShowAddForm(false);
    setAddStep('form');
    setNewAccount({ holderName: '', accountNumber: '', confirmAccount: '', ifsc: '', accountType: 'current' });
    setIfscResolved('');
    setUtrInput('');
    setAccountError('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bank Account</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your settlement account and configure payout schedules.</p>
      </div>

      {/* ── Current Settlement Account ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Building2 size={18} className="text-indigo-600" />
              </div>
              <CardTitle>Settlement Account</CardTitle>
            </div>
            <Badge variant="success" dot>Verified</Badge>
          </div>
        </CardHeader>
        <CardContent className="mt-5 space-y-5">
          {/* Account details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Account Number', value: maskAccountNumber(CURRENT_ACCOUNT.accountNumber), mono: true },
              { label: 'Account Holder', value: CURRENT_ACCOUNT.holderName },
              { label: 'Bank Name', value: CURRENT_ACCOUNT.bankName },
              { label: 'IFSC Code', value: CURRENT_ACCOUNT.ifsc, mono: true },
              { label: 'Branch', value: CURRENT_ACCOUNT.branch },
            ].map(({ label, value, mono }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
                <p className={cn('text-sm text-slate-800 font-medium', mono && 'font-mono')}>{value}</p>
              </div>
            ))}
          </div>

          {/* Penny drop info */}
          <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2.5">
            <CheckCircle2 size={14} className="shrink-0" />
            Penny drop verified on 15 Aug 2023 — ₹1 test deposit confirmed.
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => { setShowAddForm(true); setAddStep('form'); }}>
              Change Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Add / Change Account Modal ───────────────────────────────── */}
      <Modal
        open={showAddForm}
        onClose={addStep === 'success' ? resetAddFlow : () => setShowAddForm(false)}
        size="md"
      >
        {/* ── Step 1: Form ── */}
        {addStep === 'form' && (
          <>
            <ModalHeader onClose={() => setShowAddForm(false)}>
              <ModalTitle>Add New Bank Account</ModalTitle>
              <ModalDescription>Enter your bank details. A ₹1 penny drop will verify the account.</ModalDescription>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <Input
                label="Account Holder Name"
                placeholder="As per bank records"
                value={newAccount.holderName}
                onChange={(e) => setNewAccount({ ...newAccount, holderName: e.target.value })}
              />
              <Input
                label="Account Number"
                placeholder="Enter account number"
                type="password"
                value={newAccount.accountNumber}
                onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
              />
              <Input
                label="Confirm Account Number"
                placeholder="Re-enter account number"
                value={newAccount.confirmAccount}
                onChange={(e) => {
                  setNewAccount({ ...newAccount, confirmAccount: e.target.value });
                  setAccountError('');
                }}
                error={accountError}
              />
              <div className="space-y-1.5">
                <Input
                  label="IFSC Code"
                  placeholder="e.g. HDFC0001234"
                  value={newAccount.ifsc}
                  onChange={(e) => handleIfscChange(e.target.value)}
                  className="font-mono"
                />
                {ifscResolved && (
                  <p className="text-xs text-teal-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {ifscResolved}
                  </p>
                )}
              </div>
              <Select
                label="Account Type"
                value={newAccount.accountType}
                options={[
                  { value: 'savings', label: 'Savings' },
                  { value: 'current', label: 'Current' },
                ]}
                onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value })}
              />

              {/* Info box */}
              <div className="flex items-start gap-2.5 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700">
                <Info size={15} className="mt-0.5 shrink-0 text-indigo-500" />
                A ₹1 penny drop verification will be initiated. You will need to confirm the UTR number in the next step.
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={addSaving}
                disabled={!newAccount.holderName || !newAccount.accountNumber || !newAccount.ifsc}
                onClick={handleSubmitAccount}
              >
                Initiate Verification
              </Button>
            </ModalFooter>
          </>
        )}

        {/* ── Step 2: Penny Drop ── */}
        {addStep === 'penny-drop' && (
          <>
            <ModalHeader>
              <ModalTitle>Confirm ₹1 Test Deposit</ModalTitle>
              <ModalDescription>
                A ₹1 verification deposit has been sent to your new account. Enter the UTR number from your bank statement.
              </ModalDescription>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div className="flex flex-col items-center gap-2 p-6 bg-amber-50 border border-amber-100 rounded-xl text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <CreditCard size={22} className="text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Deposit initiated</p>
                <p className="text-xs text-slate-500">Check your bank app or SMS for the UTR reference number. It may take up to 30 minutes.</p>
              </div>
              <Input
                label="UTR Number"
                placeholder="e.g. 426141234567890"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                className="font-mono"
                helperText="12–22 digit reference from your bank credit alert."
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setAddStep('form')}>Back</Button>
              <Button
                variant="primary"
                loading={pennySaving}
                disabled={utrInput.trim().length < 12}
                onClick={handlePennyConfirm}
              >
                Confirm &amp; Save
              </Button>
            </ModalFooter>
          </>
        )}

        {/* ── Step 3: Success ── */}
        {addStep === 'success' && (
          <>
            <ModalHeader>
              <ModalTitle>Account Verified!</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-teal-500" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">Bank account added successfully</p>
                  <p className="text-sm text-slate-500 mt-1">Your new account is now set as the default settlement account.</p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" fullWidth onClick={resetAddFlow}>Done</Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* ── Settlement Schedule ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <CardTitle>Settlement Schedule</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Choose how quickly settled funds reach your bank account.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-5 space-y-5">
          {/* Schedule options */}
          <div className="space-y-3">
            {SCHEDULE_OPTIONS.map(({ key, label, badge, disabled }) => (
              <button
                key={key}
                disabled={disabled}
                onClick={() => !disabled && setSchedule(key)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-150',
                  disabled && 'opacity-50 cursor-not-allowed',
                  !disabled && schedule === key
                    ? 'border-indigo-500 bg-indigo-50/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white',
                )}
              >
                <div className="flex items-center gap-3">
                  {key === 'T+0' ? (
                    <Zap size={16} className="text-amber-500" />
                  ) : (
                    <ArrowRight size={16} className="text-slate-400" />
                  )}
                  <span className={cn('text-sm font-medium', !disabled && schedule === key ? 'text-indigo-700' : 'text-slate-700')}>
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {badge && <Badge variant="warning" size="sm">{badge}</Badge>}
                  {disabled && <Lock size={13} className="text-slate-400" />}
                  {!disabled && (
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 transition-colors',
                      schedule === key ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300',
                    )}>
                      {schedule === key && <div className="w-1.5 h-1.5 rounded-full bg-white m-auto mt-0.5" />}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <Input
            label="Minimum Settlement Amount (₹)"
            type="number"
            value={minSettlement}
            onChange={(e) => setMinSettlement(e.target.value)}
            helperText="Settlements below this amount will roll over to the next cycle."
            leftIcon={<span className="text-xs font-medium">₹</span>}
          />

          <div className="flex items-center justify-between">
            {scheduleSaved && (
              <div className="flex items-center gap-1.5 text-sm text-teal-600">
                <CheckCircle2 size={14} />
                Schedule updated
              </div>
            )}
            <div className="ml-auto">
              <Button variant="primary" loading={scheduleSaving} onClick={showScheduleSaved}>
                Update Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
