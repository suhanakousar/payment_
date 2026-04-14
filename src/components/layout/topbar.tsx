'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Bell, ChevronDown, User, LogOut, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeMeta: Record<string, { title: string; crumbs: string[] }> = {
  '/dashboard':                    { title: 'Dashboard',    crumbs: ['Home', 'Dashboard'] },
  '/dashboard/payments':           { title: 'Payments',     crumbs: ['Home', 'Payments'] },
  '/dashboard/payouts':            { title: 'Payouts',      crumbs: ['Home', 'Payouts'] },
  '/dashboard/transactions':       { title: 'Transactions', crumbs: ['Home', 'Transactions'] },
  '/dashboard/analytics':          { title: 'Analytics',    crumbs: ['Home', 'Analytics'] },
  '/dashboard/settings':           { title: 'Settings',     crumbs: ['Home', 'Settings'] },
  '/dashboard/settings/profile':   { title: 'Profile',      crumbs: ['Home', 'Settings', 'Profile'] },
  '/dashboard/settings/bank':      { title: 'Bank Account', crumbs: ['Home', 'Settings', 'Bank Account'] },
  '/dashboard/settings/webhooks':  { title: 'Webhooks',     crumbs: ['Home', 'Settings', 'Webhooks'] },
  '/dashboard/settings/api-keys':  { title: 'API Keys',     crumbs: ['Home', 'Settings', 'API Keys'] },
};

function getRouteMeta(pathname: string) {
  return routeMeta[pathname] ?? { title: 'Dashboard', crumbs: ['Home'] };
}

const NOTIFICATIONS = [
  { id: 1, text: 'New transaction ₹24,500 captured', time: '2m ago', color: 'bg-emerald-400' },
  { id: 2, text: 'Payout batch #BP-2044 processed', time: '18m ago', color: 'bg-indigo-400' },
  { id: 3, text: 'Stripe gateway latency degraded', time: '1h ago', color: 'bg-amber-400' },
];

export default function Topbar() {
  const pathname = usePathname();
  const { title, crumbs } = getRouteMeta(pathname);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <header
      className="h-16 flex items-center justify-between px-6 shrink-0 z-20"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.08)',
        boxShadow: '0 1px 0 rgba(99,102,241,0.06)',
      }}
    >
      {/* Left — title & breadcrumb */}
      <div className="flex flex-col justify-center gap-0.5">
        <h1 className="text-slate-900 font-bold text-base leading-none tracking-tight">{title}</h1>
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-slate-400">
            {crumbs.map((crumb, i) => (
              <li key={crumb} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300 font-light">/</span>}
                <span className={cn(i === crumbs.length - 1 ? 'text-indigo-500 font-semibold' : 'text-slate-400')}>
                  {crumb}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Right — search, notifications, user */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search transactions..."
            className={cn(
              'pl-9 pr-3 py-2 text-sm rounded-xl border',
              'bg-slate-50/80 border-slate-200 text-slate-800 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white',
              'transition-all duration-200 w-52 focus:w-64'
            )}
          />
          <kbd className="absolute right-3 hidden lg:flex items-center gap-0.5 text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>

        {/* AI badge */}
        <button
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
        >
          <Sparkles size={12} />
          Ask AI
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen((v) => !v); setDropdownOpen(false); }}
            className={cn(
              'relative w-9 h-9 flex items-center justify-center rounded-xl',
              'text-slate-500 hover:text-slate-700 transition-colors',
              bellOpen ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100'
            )}
            aria-label="Notifications"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 flex">
              <span className="animate-ping-slow absolute w-2 h-2 rounded-full bg-rose-400 opacity-60" />
              <span className="relative w-2 h-2 rounded-full bg-rose-500 ring-1.5 ring-white" />
            </span>
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
              <div
                className="absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden z-20"
                style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(99,102,241,0.1)', background: 'white' }}
              >
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <p className="text-sm font-bold text-slate-800">Notifications</p>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {NOTIFICATIONS.length} new
                  </span>
                </div>
                <div className="py-1">
                  {NOTIFICATIONS.map((n) => (
                    <button
                      key={n.id}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                      onClick={() => setBellOpen(false)}
                    >
                      <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', n.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-relaxed">{n.text}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-4 py-2.5" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <button className="w-full text-xs text-center text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                    View all notifications →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen((v) => !v); setBellOpen(false); }}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl',
              'hover:bg-slate-50 transition-colors',
              dropdownOpen && 'bg-slate-50'
            )}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-indigo-100"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
            >
              MA
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-semibold text-slate-800 leading-none">Merchant Admin</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Growth Tier</span>
            </div>
            <ChevronDown
              size={13}
              className={cn(
                'text-slate-400 transition-transform duration-200 hidden sm:block',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-20"
                style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(99,102,241,0.1)', background: 'white' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9', background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' }}>
                  <p className="text-sm font-bold text-slate-800">Merchant Admin</p>
                  <p className="text-xs text-slate-500 mt-0.5">admin@payagg.io</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Growth Tier
                  </span>
                </div>

                <div className="py-1.5">
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={14} className="text-slate-400" />
                    My Profile
                  </button>
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={14} className="text-slate-400" />
                    Settings
                  </button>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9' }} className="py-1.5">
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LogOut size={14} />
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
