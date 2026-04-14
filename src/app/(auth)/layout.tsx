'use client';

import { Zap } from 'lucide-react';

const STATS = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '20+',   label: 'Gateways' },
  { value: '₹50Cr', label: 'Daily volume' },
  { value: '34%',   label: 'Less failures' },
];

const FEATURES = [
  'Smart routing across 20+ payment gateways',
  'Real-time analytics & fraud detection',
  'Automated reconciliation & instant payouts',
  'PCI-DSS Level 1 certified infrastructure',
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ─── Left panel — Form ─── */}
      <div
        className="flex flex-col w-full lg:w-[55%] overflow-y-auto"
        style={{ background: '#FAFBFF' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-10 py-8">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              boxShadow: '0 0 20px rgba(99,102,241,0.35)',
            }}
          >
            <Zap size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span
              className="font-extrabold text-lg tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #1E293B 0%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PayAgg
            </span>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">Platform</p>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col justify-center px-10 py-6">
          <div
            className="w-full max-w-md mx-auto bg-white rounded-3xl p-8"
            style={{
              boxShadow: '0 4px 24px rgba(99,102,241,0.08), 0 1px 3px rgba(0,0,0,0.06)',
              border: '1px solid rgba(99,102,241,0.1)',
            }}
          >
            {children}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 py-6">
          &copy; {new Date().getFullYear()} PayAgg Inc. &middot; All rights reserved &middot;{' '}
          <span className="text-indigo-500 hover:underline cursor-pointer">Privacy</span>
          {' '}&middot;{' '}
          <span className="text-indigo-500 hover:underline cursor-pointer">Terms</span>
        </p>
      </div>

      {/* ─── Right panel — Decorative ─── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden px-12 py-14"
        style={{
          background: 'linear-gradient(150deg, #0C0F1E 0%, #1E1B4B 35%, #2D1B69 70%, #1E1B4B 100%)',
        }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/2 right-16 w-24 h-24 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
          />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="authgrid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#authgrid)" />
          </svg>
          {/* Floating circles */}
          <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-indigo-400 opacity-60 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 rounded-full bg-violet-400 opacity-50 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-1 h-1 rounded-full bg-amber-400 opacity-40 animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Top — badge */}
        <div className="relative z-10">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-gentle" />
            Enterprise payment infrastructure
          </span>
        </div>

        {/* Middle — main copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              One platform.
              <br />
              <span style={{ background: 'linear-gradient(90deg, #A5B4FC 0%, #C4B5FD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Every gateway.
              </span>
            </h2>
            <p className="mt-4 text-indigo-200 text-sm leading-relaxed max-w-xs">
              PayAgg connects all major payment providers under a single intelligent API.
              Maximize acceptance rates and minimize failures — automatically.
            </p>
          </div>

          {/* Feature checklist */}
          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <div
                  className="mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-indigo-100 text-sm leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-2xl font-extrabold text-white tabular-nums">{s.value}</p>
                <p className="text-xs text-indigo-300 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — testimonial */}
        <div
          className="relative z-10 rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="#F59E0B">
                <path d="M6 1l1.545 3.09L11 4.635l-2.5 2.455.59 3.455L6 8.91l-3.09 1.635L3.5 7.09 1 4.635l3.455-.545z"/>
              </svg>
            ))}
          </div>
          <p className="text-indigo-100 text-sm italic leading-relaxed">
            &ldquo;PayAgg cut our payment failures by 34% in the first month. The smart
            routing is genuinely impressive.&rdquo;
          </p>
          <div className="flex items-center gap-2.5 mt-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white/10"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
            >
              SK
            </div>
            <div>
              <p className="text-white text-xs font-bold">Sarah Kim</p>
              <p className="text-indigo-300 text-[11px]">CTO, Veloce Commerce</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
