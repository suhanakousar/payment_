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
  User,
  Building2,
  Webhook,
  KeyRound,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard },
  { label: 'Payments',     href: '/dashboard/payments',     icon: CreditCard },
  { label: 'Payouts',      href: '/dashboard/payouts',      icon: Send },
  { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowLeftRight },
  { label: 'Analytics',    href: '/dashboard/analytics',    icon: BarChart3 },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    children: [
      { label: 'Profile',      href: '/dashboard/settings/profile',  icon: User },
      { label: 'Bank Account', href: '/dashboard/settings/bank',     icon: Building2 },
      { label: 'Webhooks',     href: '/dashboard/settings/webhooks', icon: Webhook },
      { label: 'API Keys',     href: '/dashboard/settings/api-keys', icon: KeyRound },
    ],
  },
];

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
        'transition-all duration-300 ease-in-out'
      )}
      style={{
        width: collapsed ? 72 : 260,
        background: 'linear-gradient(180deg, #0C0F1E 0%, #101425 60%, #0E1222 100%)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Subtle top gradient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 animate-glow-pulse"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            boxShadow: '0 0 16px rgba(99,102,241,0.5)',
          }}
        >
          <Zap size={16} className="text-white" strokeWidth={2.5} />
        </div>

        {!collapsed && (
          <div className="flex flex-col">
            <span
              className="font-extrabold text-base tracking-tight leading-none"
              style={{
                background: 'linear-gradient(90deg, #E2E8F0 0%, #C7D2FE 50%, #A5B4FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PayAgg
            </span>
            <span className="text-[10px] text-indigo-400/70 font-medium tracking-widest uppercase mt-0.5">
              Platform
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-0.5">
        {/* Section label */}
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Main Menu
          </p>
        )}

        {navItems.map((item) => {
          const active = isActive(item.href);
          const hasChildren = Boolean(item.children?.length);

          if (hasChildren) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => !collapsed && setSettingsOpen((v) => !v)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                    'transition-all duration-200 group relative',
                    active
                      ? 'nav-item-active text-indigo-300'
                      : 'text-slate-500 hover:text-slate-200',
                    !active && 'hover:bg-white/[0.04]'
                  )}
                >
                  {/* Active left glow */}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: '#818CF8', boxShadow: '0 0 8px #6366F1' }}
                    />
                  )}
                  <div
                    className={cn(
                      'shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                      active
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-slate-500 group-hover:text-slate-300 group-hover:bg-white/[0.05]'
                    )}
                  >
                    <item.icon size={16} />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        size={13}
                        className={cn(
                          'opacity-50 transition-transform duration-200',
                          settingsOpen && 'rotate-180'
                        )}
                      />
                    </>
                  )}
                </button>

                {!collapsed && settingsOpen && (
                  <div className="mt-1 ml-4 pl-3 space-y-0.5" style={{ borderLeft: '1px solid rgba(99,102,241,0.2)' }}>
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
                            'transition-all duration-150 group',
                            childActive
                              ? 'bg-indigo-500/15 text-indigo-300'
                              : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                          )}
                        >
                          <child.icon
                            size={13}
                            className={cn(childActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-300')}
                          />
                          <span>{child.label}</span>
                          {childActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          )}
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
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-200 group relative',
                active
                  ? 'nav-item-active text-indigo-300'
                  : 'text-slate-500 hover:text-slate-200',
                !active && 'hover:bg-white/[0.04]'
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: '#818CF8', boxShadow: '0 0 8px #6366F1' }}
                />
              )}
              <div
                className={cn(
                  'shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                  active
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-500 group-hover:text-slate-300 group-hover:bg-white/[0.05]'
                )}
              >
                <item.icon size={16} />
              </div>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer',
            'hover:bg-white/[0.04]'
          )}
        >
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white ring-2 ring-indigo-500/30"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
          >
            MA
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-xs font-semibold truncate leading-none mb-0.5">Merchant Admin</p>
              <p className="text-slate-600 text-[11px] truncate">admin@payagg.io</p>
            </div>
          )}

          {!collapsed && (
            <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
          )}
        </div>

        {!collapsed && (
          <p className="mt-2 text-[10px] text-slate-700 font-mono tracking-widest px-2">
            v2.0
          </p>
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          'absolute -right-3.5 top-[68px] z-10',
          'w-7 h-7 rounded-full flex items-center justify-center',
          'transition-all duration-200 shadow-lg',
          'border border-indigo-500/30 text-indigo-300',
          'hover:text-white hover:border-indigo-400',
        )}
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #1E1B4B 100%)',
          boxShadow: '0 0 12px rgba(99,102,241,0.25)',
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}
