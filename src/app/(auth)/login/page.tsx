'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── OTP Box component ────────────────────────────────────────────────────────
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

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

// ─── Google icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');

  // Email form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailErrors, setEmailErrors] = useState<{ email?: string; password?: string }>({});

  // Phone form
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');

  // Loading states
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Tab slide indicator ref for animation
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const emailTabRef = useRef<HTMLButtonElement>(null);
  const phoneTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ref = activeTab === 'email' ? emailTabRef : phoneTabRef;
    if (ref.current) {
      setIndicatorStyle({
        left: ref.current.offsetLeft,
        width: ref.current.offsetWidth,
      });
    }
  }, [activeTab]);

  const [loginError, setLoginError] = useState<string>('');

  // ── Email sign-in ──────────────────────────────────────────────────────────
  const validateEmail = () => {
    const errs: typeof emailErrors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setEmailErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    setLoadingSubmit(true);
    setLoginError('');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error?.message ?? 'Login failed. Please try again.');
        setLoadingSubmit(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setLoginError('Network error. Please check your connection.');
      setLoadingSubmit(false);
    }
  };

  // ── Phone sign-in ──────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setPhoneError('Enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');
    setLoadingSendOtp(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoadingSendOtp(false);
    setOtpSent(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some((d) => !d)) {
      setOtpError('Please enter all 6 digits');
      return;
    }
    setOtpError('');
    setLoadingSubmit(true);
    await new Promise((r) => setTimeout(r, 2000));
    router.push('/dashboard');
  };

  // ── Google sign-in (placeholder) ──────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLoadingSubmit(true);
    await new Promise((r) => setTimeout(r, 2000));
    router.push('/dashboard');
  };

  return (
    <div className="w-full space-y-7">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-500">Sign in to your PayAgg account</p>
      </div>

      {/* Tab toggle */}
      <div
        className="relative flex rounded-xl bg-slate-100 p-1"
        role="tablist"
        aria-label="Login method"
      >
        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          aria-hidden
        />
        <button
          ref={emailTabRef}
          role="tab"
          aria-selected={activeTab === 'email'}
          onClick={() => setActiveTab('email')}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
            activeTab === 'email' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Mail size={15} />
          Email
        </button>
        <button
          ref={phoneTabRef}
          role="tab"
          aria-selected={activeTab === 'phone'}
          onClick={() => setActiveTab('phone')}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
            activeTab === 'phone' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Phone size={15} />
          Phone
        </button>
      </div>

      {/* ── Email tab ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'transition-all duration-300',
          activeTab === 'email' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none absolute'
        )}
        aria-hidden={activeTab !== 'email'}
      >
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
            {loginError && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200">
                {loginError}
              </div>
            )}
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailErrors.email) setEmailErrors((p) => ({ ...p, email: undefined }));
              }}
              error={emailErrors.email}
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (emailErrors.password) setEmailErrors((p) => ({ ...p, password: undefined }));
                  }}
                  autoComplete="current-password"
                  className={cn(
                    'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400',
                    'h-10 px-3 py-2 pr-10',
                    'transition-all duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                    emailErrors.password
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
              {emailErrors.password && (
                <p className="text-xs text-rose-500">{emailErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loadingSubmit}
              rightIcon={!loadingSubmit ? <ArrowRight size={16} /> : undefined}
              className="mt-2"
            >
              Sign in
            </Button>
          </form>
        )}
      </div>

      {/* ── Phone tab ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'transition-all duration-300',
          activeTab === 'phone' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none absolute'
        )}
        aria-hidden={activeTab !== 'phone'}
      >
        {activeTab === 'phone' && !otpSent && (
          <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Phone number</label>
              <div className="flex gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center h-10 px-3 rounded-lg border text-sm font-medium text-slate-700 bg-slate-50 select-none',
                    phoneError ? 'border-rose-400' : 'border-slate-200'
                  )}
                >
                  +91
                </div>
                <div className="flex-1">
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      if (phoneError) setPhoneError('');
                    }}
                    maxLength={10}
                    className={cn(
                      'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400',
                      'h-10 px-3 py-2',
                      'transition-all duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                      phoneError
                        ? 'border-rose-400 focus:ring-rose-500/30'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  />
                </div>
              </div>
              {phoneError && <p className="text-xs text-rose-500">{phoneError}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loadingSendOtp}
              rightIcon={!loadingSendOtp ? <ArrowRight size={16} /> : undefined}
              className="mt-2"
            >
              Send OTP
            </Button>
          </form>
        )}

        {activeTab === 'phone' && otpSent && (
          <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
            {/* Info banner */}
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <Phone size={16} className="text-indigo-500 mt-0.5 shrink-0" />
              <span className="text-slate-600">
                OTP sent to <span className="font-semibold text-slate-800">+91 {phone}</span>
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Enter OTP</label>
              <OtpInput value={otp} onChange={setOtp} />
              {otpError && <p className="text-xs text-rose-500 mt-1">{otpError}</p>}
            </div>

            {/* Resend */}
            <button
              type="button"
              onClick={() => {
                setOtp(Array(6).fill(''));
                setOtpSent(false);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Didn&apos;t receive it? Send again
            </button>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loadingSubmit}
              rightIcon={!loadingSubmit ? <ArrowRight size={16} /> : undefined}
            >
              Verify &amp; Sign In
            </Button>
          </form>
        )}
      </div>

      {/* Divider */}
      <Divider label="or continue with" />

      {/* Google button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loadingSubmit}
        className={cn(
          'w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-slate-200 bg-white',
          'text-sm font-medium text-slate-700',
          'hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm',
          'active:bg-slate-100',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30',
          'disabled:opacity-50 disabled:pointer-events-none'
        )}
      >
        {loadingSubmit ? (
          <Loader2 size={16} className="animate-spin text-slate-500" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
