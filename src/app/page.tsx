'use client';

import Link from 'next/link';
import {
  Zap, ArrowRight, BarChart3, ShieldCheck, Repeat2,
  Globe2, Sparkles, TrendingUp, CreditCard, Send, ChevronRight,
} from 'lucide-react';

const features = [
  {
    icon: Globe2,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    title: 'Smart Gateway Routing',
    desc: 'Automatically route each transaction to the best-performing gateway to maximise success rates.',
  },
  {
    icon: BarChart3,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Real-time Analytics',
    desc: 'Live dashboards with revenue trends, success rates, refund analytics, and settlement forecasts.',
  },
  {
    icon: Repeat2,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    title: 'Automated Reconciliation',
    desc: 'Instant, automated reconciliation across all payment gateways — zero manual effort.',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'PCI-DSS Certified',
    desc: 'Bank-grade encryption and PCI-DSS Level 1 certified infrastructure you can trust.',
  },
  {
    icon: Send,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Instant Payouts',
    desc: 'Disburse to any bank account or UPI handle in seconds, 24 × 7 × 365.',
  },
  {
    icon: Sparkles,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    title: 'AI-powered Insights',
    desc: 'Spot fraud patterns and optimise checkout flows with built-in AI recommendations.',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '20+',   label: 'Gateways' },
  { value: '₹50Cr', label: 'Daily Volume' },
  { value: '34%',   label: 'Less Failures' },
];

const gateways = ['Razorpay', 'Cashfree', 'Stripe', 'PayU', 'Juspay', 'CCAvenue'];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FF' }}>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(99,102,241,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                boxShadow: '0 0 16px rgba(99,102,241,0.4)',
              }}
            >
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span
                className="font-extrabold text-base tracking-tight"
                style={{
                  background: 'linear-gradient(90deg, #4338CA, #6366F1, #8B5CF6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                PayAgg
              </span>
              <span className="ml-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}
            >
              Get started
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative w-full py-20 md:py-28 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 -left-20 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 -right-20 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Enterprise payment infrastructure — now live
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            One platform.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 50%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Every gateway.
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
            PayAgg connects all major payment providers under a single intelligent API.
            Maximise acceptance rates, minimise failures, and reconcile automatically.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              }}
            >
              Start for free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-indigo-600 bg-white border border-indigo-100 hover:bg-indigo-50 transition-all"
              style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.1)' }}
            >
              View dashboard
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Gateway logos row */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Integrates with</span>
            {gateways.map((g) => (
              <span
                key={g}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-100"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Banner ─────────────────────────────────────────── */}
      <section
        className="w-full py-10"
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 40%, #7C3AED 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-white tabular-nums">{s.value}</p>
                <p className="text-sm text-indigo-200 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────── */}
      <section className="w-full py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything you need to{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                accept payments
              </span>
            </h2>
            <p className="mt-3 text-slate-500 text-base max-w-xl mx-auto">
              Built for high-growth businesses that need reliability, visibility, and speed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white p-6 hover:-translate-y-1 transition-transform"
                style={{
                  border: '1px solid rgba(99,102,241,0.08)',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.06)',
                }}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.bg}`}>
                  <f.icon size={20} className={f.color} />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1.5">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────────── */}
      <section className="w-full py-14" style={{ background: '#EEF2FF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center gap-0.5 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-xl font-semibold text-slate-800 leading-relaxed">
              &ldquo;PayAgg cut our payment failures by 34% in the first month. The smart routing is genuinely impressive.&rdquo;
            </blockquote>
            <div className="mt-5 flex items-center justify-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                SK
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800">Sarah Kim</p>
                <p className="text-xs text-slate-500">CTO, Veloce Commerce</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section
        className="w-full py-16 text-center"
        style={{
          background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 50%, #7C3AED 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrendingUp size={36} className="text-indigo-300 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Ready to supercharge your payments?
          </h2>
          <p className="text-indigo-200 text-base mb-8 max-w-lg mx-auto">
            Join hundreds of businesses already using PayAgg to maximise revenue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-indigo-700 bg-white hover:bg-indigo-50 transition-all"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
            >
              Get started free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white border border-white/30 hover:bg-white/10 transition-all"
            >
              <CreditCard size={16} />
              See the dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        className="w-full py-8"
        style={{ borderTop: '1px solid rgba(99,102,241,0.08)', background: 'white' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
            >
              <Zap size={12} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-700 text-sm">PayAgg</span>
          </div>
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} PayAgg Inc. · All rights reserved ·{' '}
            <Link href="/login" className="text-indigo-500 hover:underline">Privacy</Link>
            {' · '}
            <Link href="/login" className="text-indigo-500 hover:underline">Terms</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
