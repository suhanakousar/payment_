'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

function StepIndicator({ current, total }: { current: number; total: number }) {
  const progress = ((current - 1) / (total - 1)) * 100;
  const labels = ['Business Details', 'Personal Details', 'Set Password'];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Step {current} of {total}</span>
        <span className="text-xs text-slate-400">{labels[current - 1]}</span>
      </div>
      <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress === 0 ? 8 : progress}%`, background: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)' }}
        />
      </div>
      <div className="flex items-center justify-between">
        {Array.from({ length: total }).map((_, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < current;
          const isActive = stepNum === current;
          return (
            <div key={i} className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300',
              isDone ? 'bg-indigo-500 text-white' : isActive ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
            )}>
              {isDone ? <Check size={12} /> : stepNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= level ? color : 'bg-slate-200')} />
        ))}
      </div>
      <p className={cn('text-xs font-medium', level === 1 ? 'text-rose-500' : level === 2 ? 'text-amber-500' : 'text-emerald-600')}>
        {label} password
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const BUSINESS_CATEGORIES = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'others', label: 'Others' },
];

async function syncFirebaseUser(uid: string, email: string, displayName?: string | null) {
  const res = await fetch('/api/v1/auth/firebase', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ uid, email, displayName: displayName ?? undefined, provider: 'firebase' }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message ?? 'Sync failed');
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin]               = useState('');
  const [pan, setPan]                   = useState('');
  const [category, setCategory]         = useState('');
  const [step1Errors, setStep1Errors]   = useState<Record<string, string>>({});

  const [fullName, setFullName]               = useState('');
  const [emailAddr, setEmailAddr]             = useState('');
  const [phoneNum, setPhoneNum]               = useState('');
  const [step2Errors, setStep2Errors]         = useState<Record<string, string>>({});

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [step3Errors, setStep3Errors]         = useState<Record<string, string>>({});
  const [agreeTerms, setAgreeTerms]           = useState(false);
  const [submitError, setSubmitError]         = useState('');
  const [loadingSubmit, setLoadingSubmit]     = useState(false);
  const [loadingGoogle, setLoadingGoogle]     = useState(false);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!businessName.trim()) errs.businessName = 'Business name is required';
    if (!pan.trim()) errs.pan = 'PAN number is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase())) errs.pan = 'Enter a valid PAN (e.g. ABCDE1234F)';
    if (!category) errs.category = 'Please select a business category';
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!emailAddr.trim()) errs.emailAddr = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddr)) errs.emailAddr = 'Enter a valid email';
    if (!phoneNum.trim() || phoneNum.replace(/\D/g, '').length < 10) errs.phoneNum = 'Enter a valid 10-digit phone number';
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) errs.terms = 'You must accept the terms and conditions';
    setStep3Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setSubmitError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setSubmitError('');
    setLoadingSubmit(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, emailAddr.trim(), password);
      const user = credential.user;
      await updateProfile(user, { displayName: fullName });
      await sendEmailVerification(user);
      await syncFirebaseUser(user.uid, user.email!, fullName);
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/email-already-in-use') {
        setSubmitError('An account with this email already exists. Try signing in instead.');
      } else if (code === 'auth/weak-password') {
        setSubmitError('Password is too weak. Please use at least 8 characters with letters and numbers.');
      } else if ((err as Error).message?.includes('Sync failed')) {
        setSubmitError('Account created but could not load dashboard. Please sign in.');
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoadingGoogle(true);
    setSubmitError('');
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const user = credential.user;
      await syncFirebaseUser(user.uid, user.email!, user.displayName);
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setSubmitError('Google sign-up failed. Please try again.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
        <p className="text-sm text-slate-500">Start accepting payments in minutes</p>
      </div>

      <StepIndicator current={step} total={TOTAL_STEPS} />

      {/* Step 1 — Business Details */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-base font-semibold text-slate-800">Business Details</h2>

          <Input
            label="Business Name"
            placeholder="Acme Pvt. Ltd."
            value={businessName}
            onChange={(e) => { setBusinessName(e.target.value); if (step1Errors.businessName) setStep1Errors((p) => ({ ...p, businessName: '' })); }}
            error={step1Errors.businessName}
          />
          <Input
            label="GSTIN"
            helperText="Optional"
            placeholder="22AAAAA0000A1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            maxLength={15}
          />
          <Input
            label="PAN Number"
            placeholder="ABCDE1234F"
            value={pan}
            onChange={(e) => { setPan(e.target.value.toUpperCase()); if (step1Errors.pan) setStep1Errors((p) => ({ ...p, pan: '' })); }}
            error={step1Errors.pan}
            maxLength={10}
          />
          <Select
            label="Business Category"
            options={BUSINESS_CATEGORIES}
            placeholder="Select a category"
            value={category}
            onChange={(e) => { setCategory(e.target.value); if (step1Errors.category) setStep1Errors((p) => ({ ...p, category: '' })); }}
            error={step1Errors.category}
          />

          <div className="pt-2 space-y-3">
            <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNext} rightIcon={<ArrowRight size={16} />}>
              Next
            </Button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loadingGoogle}
              className={cn(
                'w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-slate-200 bg-white',
                'text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm',
                'active:bg-slate-100 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              <GoogleIcon />
              {loadingGoogle ? 'Connecting…' : 'Sign up with Google'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Personal Details */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-base font-semibold text-slate-800">Personal Details</h2>

          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); if (step2Errors.fullName) setStep2Errors((p) => ({ ...p, fullName: '' })); }}
            error={step2Errors.fullName}
            autoComplete="name"
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="jane@company.com"
            value={emailAddr}
            onChange={(e) => { setEmailAddr(e.target.value); if (step2Errors.emailAddr) setStep2Errors((p) => ({ ...p, emailAddr: '' })); }}
            error={step2Errors.emailAddr}
            autoComplete="email"
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Phone Number</label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 select-none">
                +91
              </div>
              <input
                type="tel"
                placeholder="98765 43210"
                value={phoneNum}
                onChange={(e) => { setPhoneNum(e.target.value.replace(/\D/g, '').slice(0, 10)); if (step2Errors.phoneNum) setStep2Errors((p) => ({ ...p, phoneNum: '' })); }}
                maxLength={10}
                className={cn(
                  'flex-1 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 h-10 px-3 py-2 transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                  step2Errors.phoneNum ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                )}
              />
            </div>
            {step2Errors.phoneNum && <p className="text-xs text-rose-500">{step2Errors.phoneNum}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" size="lg" onClick={handleBack} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNext} rightIcon={<ArrowRight size={16} />}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Set Password */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300" noValidate>
          <h2 className="text-base font-semibold text-slate-800">Set Your Password</h2>

          {submitError && (
            <div className="rounded-lg px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200">
              {submitError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (step3Errors.password) setStep3Errors((p) => ({ ...p, password: '' })); }}
                autoComplete="new-password"
                className={cn(
                  'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 h-10 px-3 py-2 pr-10 transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                  step3Errors.password ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                )}
              />
              <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {step3Errors.password && <p className="text-xs text-rose-500">{step3Errors.password}</p>}
            <PasswordStrengthBar password={password} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (step3Errors.confirmPassword) setStep3Errors((p) => ({ ...p, confirmPassword: '' })); }}
                autoComplete="new-password"
                className={cn(
                  'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 h-10 px-3 py-2 pr-10 transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                  step3Errors.confirmPassword ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                )}
              />
              <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {step3Errors.confirmPassword && <p className="text-xs text-rose-500">{step3Errors.confirmPassword}</p>}
          </div>

          <div className="space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => { setAgreeTerms(e.target.checked); if (step3Errors.terms) setStep3Errors((p) => ({ ...p, terms: '' })); }}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600">
                I agree to the{' '}
                <span className="font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer">Privacy Policy</span>
              </span>
            </label>
            {step3Errors.terms && <p className="text-xs text-rose-500 pl-6">{step3Errors.terms}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" size="lg" onClick={handleBack} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loadingSubmit} rightIcon={!loadingSubmit ? <ArrowRight size={16} /> : undefined}>
              Create account
            </Button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
