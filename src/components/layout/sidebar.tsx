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
  ChevronDown,
  User,
  Building2,
  Webhook,
  KeyRound,
  Zap,
  X,
  AlertTriangle,
  ShieldAlert,
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
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith('/dashboard/settings')
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-600 shrink-0">
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-extrabold text-[15px] tracking-tight text-slate-900">PayAgg</span>
            <span className="ml-1.5 text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Platform</span>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Main Menu
        </p>

        {navItems.map((item) => {
          const active = isActive(item.href);
          const hasChildren = Boolean(item.children?.length);

          if (hasChildren) {
            const anyChildActive = item.children!.some(c => pathname === c.href);
            return (
              <div key={item.href}>
                <button
                  onClick={() => setSettingsOpen((v) => !v)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                    (active || anyChildActive)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <div className={cn(
                    'shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
                    (active || anyChildActive) ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  )}>
                    <item.icon size={15} />
                  </div>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    size={13}
                    className={cn(
                      'text-slate-400 transition-transform duration-200',
                      settingsOpen && 'rotate-180'
                    )}
                  />
                </button>

                {settingsOpen && (
                  <div className="mt-1 ml-4 pl-3 space-y-0.5 border-l border-slate-100">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onMobileClose}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                            childActive
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                          )}
                        >
                          <child.icon size={13} className={childActive ? 'text-indigo-500' : 'text-slate-400'} />
                          <span>{child.label}</span>
                          {childActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <div className={cn(
                'shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
                active ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
              )}>
                <item.icon size={15} />
              </div>
              <span className="flex-1">{item.label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
              {!active && item.badge && (
                <span className="text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="px-4 py-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white ring-2 ring-indigo-100"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
            MA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-800 text-xs font-semibold truncate leading-none mb-0.5">Merchant Admin</p>
            <p className="text-slate-400 text-[11px] truncate">Growth Tier</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white shrink-0" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 hidden md:flex flex-col fixed h-full z-50">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed top-0 left-0 h-full w-64 z-50 md:hidden flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
