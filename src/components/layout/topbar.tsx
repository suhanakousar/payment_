'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Route → title / breadcrumb map
// ---------------------------------------------------------------------------
const routeMeta: Record<string, { title: string; crumbs: string[] }> = {
  '/dashboard': { title: 'Dashboard', crumbs: ['Home', 'Dashboard'] },
  '/dashboard/payments': { title: 'Payments', crumbs: ['Home', 'Payments'] },
  '/dashboard/payouts': { title: 'Payouts', crumbs: ['Home', 'Payouts'] },
  '/dashboard/transactions': { title: 'Transactions', crumbs: ['Home', 'Transactions'] },
  '/dashboard/analytics': { title: 'Analytics', crumbs: ['Home', 'Analytics'] },
  '/dashboard/settings/profile': { title: 'Profile', crumbs: ['Home', 'Settings', 'Profile'] },
  '/dashboard/settings/bank': { title: 'Bank Account', crumbs: ['Home', 'Settings', 'Bank Account'] },
  '/dashboard/settings/webhooks': { title: 'Webhooks', crumbs: ['Home', 'Settings', 'Webhooks'] },
  '/dashboard/settings/api-keys': { title: 'API Keys', crumbs: ['Home', 'Settings', 'API Keys'] },
  '/dashboard/settings': { title: 'Settings', crumbs: ['Home', 'Settings'] },
};

function getRouteMeta(pathname: string) {
  return (
    routeMeta[pathname] ?? {
      title: 'Dashboard',
      crumbs: ['Home'],
    }
  );
}

// ---------------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------------
export default function Topbar() {
  const pathname = usePathname();
  const { title, crumbs } = getRouteMeta(pathname);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-100 shrink-0 z-20">
      {/* ----------------------------------------------------------------- */}
      {/* Left — title & breadcrumb */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col justify-center gap-0.5">
        <h1 className="text-slate-800 font-semibold text-base leading-none">{title}</h1>
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-slate-400">
            {crumbs.map((crumb, i) => (
              <li key={crumb} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">/</span>}
                <span
                  className={cn(
                    i === crumbs.length - 1 ? 'text-indigo-500 font-medium' : 'text-slate-400'
                  )}
                >
                  {crumb}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Right — search, notifications, user */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search
            size={15}
            className="absolute left-3 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search transactions..."
            className={cn(
              'pl-9 pr-4 py-2 text-sm rounded-lg border',
              'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300',
              'transition-all w-52 focus:w-64'
            )}
          />
        </div>

        {/* Notification bell */}
        <button
          className={cn(
            'relative w-9 h-9 flex items-center justify-center rounded-lg',
            'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
            'transition-colors'
          )}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Badge */}
          <span
            className={cn(
              'absolute top-1.5 right-1.5 w-4 h-4 rounded-full',
              'flex items-center justify-center text-[9px] font-bold text-white',
              'bg-red-500 ring-2 ring-white'
            )}
          >
            3
          </span>
        </button>

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-lg',
              'hover:bg-slate-100 transition-colors',
              dropdownOpen && 'bg-slate-100'
            )}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
            >
              MA
            </div>
            <ChevronDown
              size={14}
              className={cn(
                'text-slate-400 transition-transform duration-150 hidden sm:block',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div
                className={cn(
                  'absolute right-0 mt-2 w-52 rounded-xl shadow-lg z-20',
                  'bg-white border border-slate-100',
                  'py-1.5 overflow-hidden'
                )}
                style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
              >
                {/* User info */}
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="text-slate-800 font-semibold text-sm">Merchant Admin</p>
                  <p className="text-slate-400 text-xs truncate">admin@payagg.io</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={15} className="text-slate-400" />
                    My Profile
                  </button>
                  <button
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={15} className="text-slate-400" />
                    Settings
                  </button>
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LogOut size={15} />
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
