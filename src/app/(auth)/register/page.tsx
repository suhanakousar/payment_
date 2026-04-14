'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  const progress = ((current - 1) / (total - 1)) * 100;

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          Step {current} of {total}
        </span>
        <span className="text-xs text-slate-400">
          {current === 1 ? 'Business Details' : current === 2 ? 'Personal Details' : 'Verification'}
        </span>
      </div>

      {/* Progress track */}
      <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress === 0 ? 8 : progress}%`,
            background: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)',
          }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between">
        {Array.from({ length: total }).map((_, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < current;
          const isActive = stepNum === current;
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300',
                  isDone
                    ? 'bg-indigo-500 text-white'
                    : isActive
                    ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                )}
              >
                {isDone ? <Check size={12} /> : stepNum}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({
  length = 6,
  value,
  onChange,
}: {
  length?: number;
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const next = [...value];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    onChange(next);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex items-center gap-2.5">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            'w-11 h-12 text-center text-lg font-semibold rounded-xl border-2',
            'bg-white text-slate-900 transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
            value[i]
              ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
              : 'border-slate-200 hover:border-slate-300 focus:border-indigo-400'
          )}
        />
      ))}
    </div>
  );
}

// ─── Password strength indicator ──────────────────────────────────────────────
function getPasswordStrength(password: string): { label: string; level: 0 | 1 | 2 | 3; color: string } {
  if (!password) return { label: '', level: 0, color: 'bg-slate-200' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', level: 1, color: 'bg-rose-400' };
  if (score <= 2) return { label: 'Medium', level: 2, color: 'bg-amber-400' };
  return { label: 'Strong', level: 3, color: 'bg-emerald-500' };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { label, level, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= level ? color : 'bg-slate-200'
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          'text-xs font-medium',
          level === 1 ? 'text-rose-500' : level === 2 ? 'text-amber-500' : 'text-emerald-600'
        )}
      >
        {label} password
      </p>
    </div>
  );
}

// ─── Resend timer ─────────────────────────────────────────────────────────────
function ResendTimer({
  seconds,
  onResend,
}: {
  seconds: number;
  onResend: () => void;
}) {
  if (seconds > 0) {
    return (
      <p className="text-sm text-slate-500">
        Resend OTP in{' '}
        <span className="font-semibold text-indigo-600 tabular-nums">
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:
          {String(seconds % 60).padStart(2, '0')}
        </span>
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onResend}
      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
    >
      Resend OTP
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const BUSINESS_CATEGORIES = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'others', label: 'Others' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  // ── Step 1: Business details ──────────────────────────────────────────────
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [category, setCategory] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // ── Step 2: Personal details ──────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [emailAddr, setEmailAddr] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  // ── Step 3: Verification ──────────────────────────────────────────────────
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(30);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Resend countdown
  useEffect(() => {
    if (step !== 3) return;
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, resendSeconds]);

  const handleResendOtp = () => {
    setResendSeconds(30);
    setOtp(Array(6).fill(''));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!businessName.trim()) errs.businessName = 'Business name is required';
    if (!pan.trim()) errs.pan = 'PAN number is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase()))
      errs.pan = 'Enter a valid PAN (e.g. ABCDE1234F)';
    if (!category) errs.category = 'Please select a business category';
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!emailAddr.trim()) errs.emailAddr = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddr)) errs.emailAddr = 'Enter a valid email';
    if (!phoneNum.trim() || phoneNum.replace(/\D/g, '').length < 10)
      errs.phoneNum = 'Enter a valid 10-digit phone number';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some((d) => !d)) { setOtpError('Please enter all 6 digits'); return; }
    setOtpError('');
    if (!agreeTerms) { setTermsError('You must accept the terms and conditions'); return; }
    setTermsError('');
    setLoadingSubmit(true);
    await new Promise((r) => setTimeout(r, 2000));
    router.push('/dashboard');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
        <p className="text-sm text-slate-500">Start accepting payments in minutes</p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} total={TOTAL_STEPS} />

      {/* ── STEP 1: Business Details ───────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-base font-semibold text-slate-800">Business Details</h2>

          <Input
            label="Business Name"
            placeholder="Acme Pvt. Ltd."
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (step1Errors.businessName) setStep1Errors((p) => ({ ...p, businessName: undefined as unknown as string }));
            }}
            error={step1Errors.businessName}
          />

          <Input
            label="GSTIN"
            helperText="Optional — Goods and Services Tax Identification Number"
            placeholder="22AAAAA0000A1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            maxLength={15}
          />

          <div className="space-y-1.5">
            <Input
              label="PAN Number"
              placeholder="ABCDE1234F"
              value={pan}
              onChange={(e) => {
                setPan(e.target.value.toUpperCase());
                if (step1Errors.pan) setStep1Errors((p) => ({ ...p, pan: undefined as unknown as string }));
              }}
              error={step1Errors.pan}
              maxLength={10}
            />
          </div>

          <Select
            label="Business Category"
            options={BUSINESS_CATEGORIES}
            placeholder="Select a category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (step1Errors.category) setStep1Errors((p) => ({ ...p, category: undefined as unknown as string }));
            }}
            error={step1Errors.category}
          />

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNext}
              rightIcon={<ArrowRight size={16} />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Personal Details ───────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-base font-semibold text-slate-800">Personal Details</h2>

          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (step2Errors.fullName) setStep2Errors((p) => ({ ...p, fullName: undefined as unknown as string }));
            }}
            error={step2Errors.fullName}
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="jane@company.com"
            value={emailAddr}
            onChange={(e) => {
              setEmailAddr(e.target.value);
              if (step2Errors.emailAddr) setStep2Errors((p) => ({ ...p, emailAddr: undefined as unknown as string }));
            }}
            error={step2Errors.emailAddr}
            autoComplete="email"
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Phone Number</label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 select-none">
                +91
              </div>
              <div className="flex-1">
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phoneNum}
                  onChange={(e) => {
                    setPhoneNum(e.target.value.replace(/\D/g, '').slice(0, 10));
                    if (step2Errors.phoneNum) setStep2Errors((p) => ({ ...p, phoneNum: undefined as unknown as string }));
                  }}
                  maxLength={10}
                  className={cn(
                    'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400',
                    'h-10 px-3 py-2',
                    'transition-all duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                    step2Errors.phoneNum
                      ? 'border-rose-400 focus:ring-rose-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                />
              </div>
            </div>
            {step2Errors.phoneNum && (
              <p className="text-xs text-rose-500">{step2Errors.phoneNum}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (step2Errors.password) setStep2Errors((p) => ({ ...p, password: undefined as unknown as string }));
                }}
                autoComplete="new-password"
                className={cn(
                  'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400',
                  'h-10 px-3 py-2 pr-10',
                  'transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                  step2Errors.password
                    ? 'border-rose-400 focus:ring-rose-500/30'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {step2Errors.password && (
              <p className="text-xs text-rose-500">{step2Errors.password}</p>
            )}
            <PasswordStrengthBar password={password} />
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (step2Errors.confirmPassword)
                    setStep2Errors((p) => ({ ...p, confirmPassword: undefined as unknown as string }));
                }}
                autoComplete="new-password"
                className={cn(
                  'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400',
                  'h-10 px-3 py-2 pr-10',
                  'transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                  step2Errors.confirmPassword
                    ? 'border-rose-400 focus:ring-rose-500/30'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {step2Errors.confirmPassword && (
              <p className="text-xs text-rose-500">{step2Errors.confirmPassword}</p>
            )}
            {/* Match indicator */}
            {confirmPassword && password && !step2Errors.confirmPassword && (
              <p
                className={cn(
                  'text-xs font-medium flex items-center gap-1',
                  password === confirmPassword ? 'text-emerald-600' : 'text-rose-500'
                )}
              >
                {password === confirmPassword ? (
                  <><Check size={12} /> Passwords match</>
                ) : (
                  'Passwords do not match'
                )}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleBack}
              leftIcon={<ArrowLeft size={16} />}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleNext}
              rightIcon={<ArrowRight size={16} />}
              className="flex-1"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Verification ───────────────────────────────────────────── */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" noValidate>
          <h2 className="text-base font-semibold text-slate-800">Email Verification</h2>

          {/* Info banner */}
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm"
            style={{
              background: 'rgba(99,102,241,0.07)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            <Mail size={16} className="text-indigo-500 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-slate-700 font-medium">Check your inbox</p>
              <p className="text-slate-500 text-xs">
                We&apos;ve sent a 6-digit OTP to{' '}
                <span className="font-semibold text-slate-700">{emailAddr}</span>
              </p>
            </div>
          </div>

          {/* OTP boxes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Enter OTP</label>
            <OtpInput value={otp} onChange={setOtp} />
            {otpError && <p className="text-xs text-rose-500 mt-1">{otpError}</p>}
          </div>

          {/* Resend timer */}
          <ResendTimer seconds={resendSeconds} onResend={handleResendOtp} />

          {/* Terms */}
          <div className="space-y-1">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5 flex-shrink-0">
                <div
                  onClick={() => {
                    setAgreeTerms((p) => !p);
                    if (termsError) setTermsError('');
                  }}
                  role="checkbox"
                  aria-checked={agreeTerms}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setAgreeTerms((p) => !p);
                      if (termsError) setTermsError('');
                    }
                  }}
                  className={cn(
                    'w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all duration-150 cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
                    agreeTerms
                      ? 'bg-indigo-500 border-indigo-500'
                      : termsError
                      ? 'border-rose-400'
                      : 'border-slate-300 group-hover:border-indigo-400'
                  )}
                >
                  {agreeTerms && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-sm text-slate-600 leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {termsError && <p className="text-xs text-rose-500 pl-7">{termsError}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleBack}
              leftIcon={<ArrowLeft size={16} />}
              className="flex-1"
              disabled={loadingSubmit}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loadingSubmit}
              rightIcon={!loadingSubmit ? <Check size={16} /> : undefined}
              className="flex-1"
            >
              Create Account
            </Button>
          </div>
        </form>
      )}

      {/* Sign-in link */}
      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
