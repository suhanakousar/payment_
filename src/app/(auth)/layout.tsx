'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ----------------------------------------------------------------- */}
      {/* Left panel — 60% — form area */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col w-full lg:w-[60%] bg-white px-8 py-10 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)',
            }}
          >
            <span className="text-white font-black text-sm">P</span>
          </div>
          <span
            className="font-bold text-xl tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #1E293B 0%, #6366F1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PayAgg
          </span>
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          &copy; {new Date().getFullYear()} PayAgg Inc. All rights reserved.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Right panel — 40% — decorative (hidden on mobile) */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="hidden lg:flex flex-col justify-between w-[40%] relative overflow-hidden px-12 py-14"
        style={{
          background: 'linear-gradient(145deg, #312E81 0%, #4338CA 35%, #1E1B4B 100%)',
        }}
      >
        {/* Floating abstract shapes */}
        {/* Shape 1 — large circle top-right */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #A5B4FC 0%, transparent 70%)' }}
        />
        {/* Shape 2 — medium circle bottom-left */}
        <div
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)' }}
        />
        {/* Shape 3 — small amber accent */}
        <div
          className="absolute top-1/3 right-10 w-20 h-20 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
        />
        {/* Shape 4 — ring */}
        <div
          className="absolute bottom-1/3 left-8 w-32 h-32 rounded-full border border-white/10"
        />
        {/* Shape 5 — small dot cluster */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-4 gap-3 opacity-10">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Badge */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#A5B4FC' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            SaaS-grade infrastructure
          </span>
        </div>

        {/* Marketing copy */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white leading-snug">
            One platform.
            <br />
            <span style={{ color: '#A5B4FC' }}>Every gateway.</span>
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed max-w-xs">
            PayAgg connects all major payment providers under a single, intelligent API.
            Maximize acceptance rates and minimize failures — automatically.
          </p>

          {/* Feature list */}
          <ul className="space-y-3">
            {[
              'Smart routing across 20+ gateways',
              'Real-time transaction analytics',
              'Automated reconciliation & payouts',
              'PCI-DSS Level 1 certified',
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.4)' }}
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    className="text-indigo-300"
                  >
                    <path
                      d="M1 4l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-indigo-100 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom — testimonial / stat */}
        <div
          className="relative z-10 rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}
        >
          <p className="text-indigo-100 text-sm italic leading-relaxed">
            &ldquo;PayAgg cut our payment failures by 34% in the first month. The smart
            routing is genuinely impressive.&rdquo;
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
            >
              SK
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Sarah Kim</p>
              <p className="text-indigo-300 text-[11px]">CTO, Veloce Commerce</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
