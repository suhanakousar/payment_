import Link from 'next/link';
import { User, Building2, Webhook, KeyRound, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const settingsSections = [
  {
    href: '/dashboard/settings/profile',
    icon: User,
    title: 'Profile & Business',
    description: 'Manage your business details, KYC documents, and personal information.',
    accent: 'bg-indigo-50 text-indigo-600',
    border: 'hover:border-indigo-200',
  },
  {
    href: '/dashboard/settings/bank',
    icon: Building2,
    title: 'Bank Account',
    description: 'Update your settlement bank account and configure payout schedules.',
    accent: 'bg-amber-50 text-amber-600',
    border: 'hover:border-amber-200',
  },
  {
    href: '/dashboard/settings/webhooks',
    icon: Webhook,
    title: 'Webhooks',
    description: 'Configure webhook endpoints, event subscriptions, and view delivery logs.',
    accent: 'bg-violet-50 text-violet-600',
    border: 'hover:border-violet-200',
  },
  {
    href: '/dashboard/settings/api-keys',
    icon: KeyRound,
    title: 'API Keys',
    description: 'Generate and manage API keys for Live and Sandbox environments.',
    accent: 'bg-teal-50 text-teal-600',
    border: 'hover:border-teal-200',
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account preferences, integrations, and security settings.
        </p>
      </div>

      {/* 2×2 grid of setting cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {settingsSections.map(({ href, icon: Icon, title, description, accent, border }) => (
          <Link key={href} href={href} className="group block outline-none">
            <Card
              className={`h-full border-2 border-transparent transition-all duration-200 ${border} group-focus-visible:ring-2 group-focus-visible:ring-indigo-500/40`}
              hoverable
            >
              <CardContent className="flex flex-col gap-4 p-6 h-full">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent} shrink-0`}>
                  <Icon size={22} />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">{description}</p>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-2 transition-all duration-150">
                  Manage
                  <ChevronRight size={15} className="transition-transform duration-150 group-hover:translate-x-0.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-400 text-center">
        Changes take effect immediately unless a verification step is required.
      </p>
    </div>
  );
}
