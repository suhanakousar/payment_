'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Eye, EyeOff, Mail, Phone, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

function Divider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

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

export default function LoginPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailErrors, setEmailErrors] = useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError]   = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const emailTabRef = useRef<HTMLButtonElement>(null);
  const phoneTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ref = activeTab === 'email' ? emailTabRef : phoneTabRef;
    if (ref.current) {
      setIndicatorStyle({ left: ref.current.offsetLeft, width: ref.current.offsetWidth });
    }
  }, [activeTab]);

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
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = credential.user;
      await syncFirebaseUser(user.uid, user.email!, user.displayName);
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setLoginError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setLoginError('Too many attempts. Please wait a moment and try again.');
      } else if (code === 'auth/user-disabled') {
        setLoginError('Your account has been disabled. Please contact support.');
      } else if ((err as Error).message?.includes('Sync failed')) {
        setLoginError('Signed in but could not load your account. Please try again.');
      } else {
        setLoginError('Something went wrong. Please try again.');
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const user = credential.user;
      await syncFirebaseUser(user.uid, user.email!, user.displayName);
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user dismissed
      } else {
        setLoginError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="w-full space-y-7">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-500">Sign in to your PayAgg account</p>
      </div>

      {/* Tab toggle */}
      <div className="relative flex rounded-xl bg-slate-100 p-1" role="tablist">
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
          <Mail size={15} /> Email
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
          <Phone size={15} /> Phone
        </button>
      </div>

      {/* Email tab */}
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
            onChange={(e) => { setEmail(e.target.value); if (emailErrors.email) setEmailErrors((p) => ({ ...p, email: undefined })); }}
            error={emailErrors.email}
            autoComplete="email"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (emailErrors.password) setEmailErrors((p) => ({ ...p, password: undefined })); }}
                autoComplete="current-password"
                className={cn(
                  'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400',
                  'h-10 px-3 py-2 pr-10 transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
                  emailErrors.password ? 'border-rose-400 focus:ring-rose-500/30' : 'border-slate-200 hover:border-slate-300'
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
            {emailErrors.password && <p className="text-xs text-rose-500">{emailErrors.password}</p>}
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

      {/* Phone tab */}
      {activeTab === 'phone' && (
        <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <Phone size={16} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold">Phone OTP sign-in is not enabled yet</p>
              <p className="mt-1 text-amber-800/80">Email/password and Google login are available. Phone OTP requires a Twilio or MSG91 integration.</p>
            </div>
          </div>
        </div>
      )}

      <Divider label="or continue with" />

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loadingGoogle}
        className={cn(
          'w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-slate-200 bg-white',
          'text-sm font-medium text-slate-700',
          'hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm',
          'active:bg-slate-100 transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        <GoogleIcon />
        {loadingGoogle ? 'Signing in…' : 'Continue with Google'}
      </button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Register
        </Link>
      </p>
    </div>
  );
}
