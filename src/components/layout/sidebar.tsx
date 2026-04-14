'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Send,
  ArrowLeftRight,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  Webhook,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

// ---------------------------------------------------------------------------
// Navigation definition
// ---------------------------------------------------------------------------
const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Payouts', href: '/dashboard/payouts', icon: Send },
  { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowLeftRight },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    children: [
      { label: 'Profile', href: '/dashboard/settings/profile', icon: User },
      { label: 'Bank Account', href: '/dashboard/settings/bank', icon: Building2 },
      { label: 'Webhooks', href: '/dashboard/settings/webhooks', icon: Webhook },
      { label: 'API Keys', href: '/dashboard/settings/api-keys', icon: KeyRound },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------
export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith('/dashboard/settings')
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen shrink-0 overflow-hidden',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Logo */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        {/* Icon mark */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)',
          }}
        >
          <span className="text-white font-black text-sm tracking-tight">P</span>
        </div>

        {/* Wordmark */}
        {!collapsed && (
          <span
            className="font-bold text-lg tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #E2E8F0 0%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PayAgg
          </span>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Navigation */}
      {/* ----------------------------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const hasChildren = Boolean(item.children?.length);

          if (hasChildren) {
            return (
              <div key={item.href}>
                {/* Parent button */}
                <button
                  onClick={() => !collapsed && setSettingsOpen((v) => !v)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    'transition-all duration-150 group',
                    active
                      ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-900/40'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  )}
                >
                  <item.icon
                    size={18}
                    className={cn(
                      'shrink-0 transition-colors',
                      active ? 'text-indigo-200' : 'group-hover:text-slate-200'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {settingsOpen ? (
                        <ChevronUp size={14} className="opacity-60" />
                      ) : (
                        <ChevronDown size={14} className="opacity-60" />
                      )}
                    </>
                  )}
                </button>

                {/* Sub-items */}
                {!collapsed && settingsOpen && (
                  <div className="mt-0.5 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                            'transition-all duration-150 group',
                            childActive
                              ? 'bg-indigo-600/80 text-white'
                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          )}
                        >
                          <child.icon
                            size={15}
                            className={cn(
                              'shrink-0',
                              childActive ? 'text-indigo-200' : 'group-hover:text-slate-300'
                            )}
                          />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-all duration-150 group',
                active
                  ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              <item.icon
                size={18}
                className={cn(
                  'shrink-0 transition-colors',
                  active ? 'text-indigo-200' : 'group-hover:text-slate-200'
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* User area */}
      {/* ----------------------------------------------------------------- */}
      <div className="border-t border-white/5 px-3 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
          >
            MA
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-xs font-semibold truncate">Merchant Admin</p>
              <p className="text-slate-500 text-[11px] truncate">admin@payagg.io</p>
            </div>
          )}
        </div>

        {/* Version tag */}
        {!collapsed && (
          <p className="mt-2 text-[10px] text-slate-600 font-mono tracking-wider px-1">
            v2.0
          </p>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Collapse / expand button */}
      {/* ----------------------------------------------------------------- */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          'absolute -right-3 top-[72px] z-10',
          'w-6 h-6 rounded-full flex items-center justify-center',
          'bg-slate-700 border border-slate-600 text-slate-300',
          'hover:bg-indigo-600 hover:border-indigo-500 hover:text-white',
          'transition-all duration-150 shadow-md'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
