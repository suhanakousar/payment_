'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import {
  LayoutDashboard,
  CreditCard,
  Send,
  ArrowLeftRight,
  BarChart3,
  Settings,
  ChevronDown,
  User,
  Building2,
  Webhook,
  KeyRound,
  X,
  AlertTriangle,
  ShieldAlert,
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
  { label: 'Disputes',     href: '/dashboard/disputes',     icon: AlertTriangle },
  { label: 'Chargebacks',  href: '/dashboard/chargebacks',  icon: ShieldAlert },
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

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { displayName, initials, tierLabel } = useUser();
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith('/dashboard/settings')
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between h-16 px-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 animate-glow-pulse"
            style={{ background: 'linear-gradient(135deg, #22D3EE, #A78BFA)' }}
          >
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span
              className="font-extrabold text-[15px] tracking-tight gradient-text-cyan"
            >
              PayAgg
            </span>
            <span
              className="ml-1.5 text-[9px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Platform
            </span>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p
          className="px-3 pb-3 text-[9px] font-bold uppercase tracking-[0.15em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Main Menu
        </p>

        {navItems.map((item) => {
          const active = isActive(item.href);
          const hasChildren = Boolean(item.children?.length);

          if (hasChildren) {
            const anyChildActive = item.children!.some(c => pathname === c.href);
            const isExpanded = settingsOpen;
            return (
              <div key={item.href}>
                <button
                  onClick={() => setSettingsOpen((v) => !v)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    (active || anyChildActive)
                      ? 'nav-item-active'
                      : 'hover:bg-[rgba(255,255,255,0.04)]'
                  )}
                  style={{
                    color: (active || anyChildActive)
                      ? 'var(--primary)'
                      : 'var(--text-secondary)',
                  }}
                >
                  <div
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      background: (active || anyChildActive)
                        ? 'rgba(34,211,238,0.15)'
                        : 'transparent',
                    }}
                  >
                    <item.icon size={14} />
                  </div>
                  <span className="flex-1 text-left text-[13px]">{item.label}</span>
                  <ChevronDown
                    size={12}
                    className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>

                {isExpanded && (
                  <div
                    className="mt-1 ml-4 pl-3 space-y-0.5"
                    style={{ borderLeft: '1px solid var(--border)' }}
                  >
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onMobileClose}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150"
                          style={{
                            color: childActive ? 'var(--primary)' : 'var(--text-secondary)',
                            background: childActive ? 'rgba(34,211,238,0.08)' : 'transparent',
                          }}
                        >
                          <child.icon size={12} />
                          <span>{child.label}</span>
                          {childActive && (
                            <span
                              className="ml-auto w-1.5 h-1.5 rounded-full"
                              style={{ background: 'var(--primary)' }}
                            />
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
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                active ? 'nav-item-active' : 'hover:bg-[rgba(255,255,255,0.04)]'
              )}
              style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }}
            >
              <div
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: active ? 'rgba(34,211,238,0.15)' : 'transparent',
                }}
              >
                <item.icon size={14} />
              </div>
              <span className="flex-1">{item.label}</span>
              {active && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--primary)' }}
                />
              )}
              {!active && item.badge && (
                <span
                  className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                  style={{ background: 'var(--error)', color: 'white' }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="px-3 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer hover:bg-[rgba(255,255,255,0.04)]"
        >
          <div
            className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #22D3EE, #A78BFA)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[12px] font-semibold truncate leading-none mb-0.5"
              style={{ color: 'var(--text-primary)' }}
            >
              {displayName}
            </p>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
              {tierLabel}
            </p>
          </div>
          <div
            className="w-2 h-2 rounded-full ring-2 shrink-0"
            style={{ background: '#34D399', boxShadow: '0 0 0 2px var(--sidebar-bg)' }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-60 hidden md:flex flex-col fixed h-full z-50">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={onMobileClose}
          />
          <aside className="fixed top-0 left-0 h-full w-60 z-50 md:hidden flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
