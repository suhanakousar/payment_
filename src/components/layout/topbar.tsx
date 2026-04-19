'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Bell, ChevronDown, User, LogOut, Settings, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';

const routeMeta: Record<string, { title: string; crumbs: string[] }> = {
  '/dashboard':                    { title: 'Dashboard',    crumbs: ['Home', 'Dashboard'] },
  '/dashboard/payments':           { title: 'Payments',     crumbs: ['Home', 'Payments'] },
  '/dashboard/payouts':            { title: 'Payouts',      crumbs: ['Home', 'Payouts'] },
  '/dashboard/transactions':       { title: 'Transactions', crumbs: ['Home', 'Transactions'] },
  '/dashboard/disputes':           { title: 'Disputes',     crumbs: ['Home', 'Disputes'] },
  '/dashboard/chargebacks':        { title: 'Chargebacks',  crumbs: ['Home', 'Chargebacks'] },
  '/dashboard/analytics':          { title: 'Analytics',    crumbs: ['Home', 'Analytics'] },
  '/dashboard/settings':           { title: 'Settings',     crumbs: ['Home', 'Settings'] },
  '/dashboard/settings/profile':   { title: 'Profile',      crumbs: ['Home', 'Settings', 'Profile'] },
  '/dashboard/settings/bank':      { title: 'Bank Account', crumbs: ['Home', 'Settings', 'Bank Account'] },
  '/dashboard/settings/webhooks':  { title: 'Webhooks',     crumbs: ['Home', 'Settings', 'Webhooks'] },
  '/dashboard/settings/api-keys':  { title: 'API Keys',     crumbs: ['Home', 'Settings', 'API Keys'] },
};

const NOTIFICATIONS = [
  { id: 1, text: 'New transaction ₹24,500 captured', time: '2m ago',  color: '#34D399' },
  { id: 2, text: 'Payout batch #BP-2847 processed',  time: '18m ago', color: '#22D3EE' },
  { id: 3, text: 'Processing latency elevated',       time: '1h ago',  color: '#FCD34D' },
];

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const meta     = routeMeta[pathname] ?? { title: 'Dashboard', crumbs: ['Home'] };
  const { displayName, initials, tierLabel, email } = useUser();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen,     setBellOpen]     = useState(false);

  return (
    <header
      className="h-16 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shrink-0"
      style={{
        background: 'rgba(7,12,27,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex flex-col justify-center">
          <h1
            className="font-bold text-base leading-none tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {meta.title}
          </h1>
          <nav aria-label="breadcrumb" className="hidden sm:block">
            <ol className="flex items-center gap-1 text-[11px] mt-0.5">
              {meta.crumbs.map((crumb, i) => (
                <li key={crumb} className="flex items-center gap-1">
                  {i > 0 && <span style={{ color: 'var(--text-muted)' }}>/</span>}
                  <span style={{
                    color: i === meta.crumbs.length - 1
                      ? 'var(--primary)'
                      : 'var(--text-muted)',
                    fontWeight: i === meta.crumbs.length - 1 ? 600 : 400,
                  }}>
                    {crumb}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search size={13} className="absolute left-3 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-3 py-2 text-[13px] rounded-xl w-44 focus:w-56 transition-all input-dark"
          />
        </div>

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen(v => !v); setDropdownOpen(false); }}
            className={cn(
              'relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
              bellOpen
                ? 'bg-[rgba(34,211,238,0.1)] text-cyan-400'
                : 'hover:bg-[rgba(255,255,255,0.06)]'
            )}
            style={{ color: bellOpen ? 'var(--primary)' : 'var(--text-secondary)' }}
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-1"
              style={{ background: 'var(--error)', boxShadow: '0 0 0 1px var(--sidebar-bg)' }}
            />
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
              <div
                className="absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden z-20"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Notifications
                  </p>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--primary)' }}
                  >
                    {NOTIFICATIONS.length} new
                  </span>
                </div>
                <div className="py-1">
                  {NOTIFICATIONS.map(n => (
                    <button
                      key={n.id}
                      onClick={() => setBellOpen(false)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                    >
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: n.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {n.text}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {n.time}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    className="w-full text-xs text-center font-semibold transition-colors"
                    style={{ color: 'var(--primary)' }}
                  >
                    View all notifications →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div
          className="w-px h-5 mx-1 hidden sm:block"
          style={{ background: 'var(--border)' }}
        />

        {/* User */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen(v => !v); setBellOpen(false); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.05)]"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #22D3EE, #A78BFA)' }}
            >
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[12px] font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </span>
              <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {tierLabel}
              </span>
            </div>
            <ChevronDown
              size={12}
              className={cn('transition-transform hidden sm:block', dropdownOpen && 'rotate-180')}
              style={{ color: 'var(--text-muted)' }}
            />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div
                className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden z-20"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                <div
                  className="px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(167,139,250,0.08))',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {displayName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {email}
                  </p>
                  <span
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--primary)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {tierLabel}
                  </span>
                </div>
                <div className="py-1.5">
                  {[
                    { label: 'My Profile', icon: User, path: '/dashboard/settings/profile' },
                    { label: 'Settings',   icon: Settings, path: '/dashboard/settings' },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { setDropdownOpen(false); router.push(item.path); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <item.icon size={13} style={{ color: 'var(--text-muted)' }} />
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="py-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/login'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors hover:bg-[rgba(248,113,113,0.08)]"
                    style={{ color: 'var(--error)' }}
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
