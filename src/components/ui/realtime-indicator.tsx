'use client';

import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface RealtimeIndicatorProps {
  connected?: boolean;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
  className?: string;
  label?: string;
}

export function RealtimeIndicator({
  connected = true,
  isRefreshing = false,
  lastUpdated,
  className,
  label = 'Live',
}: RealtimeIndicatorProps) {
  const now = new Date();
  const secsAgo = lastUpdated
    ? Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
    : null;

  const agoLabel =
    secsAgo === null ? '' :
    secsAgo < 5 ? 'just now' :
    secsAgo < 60 ? `${secsAgo}s ago` :
    `${Math.floor(secsAgo / 60)}m ago`;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold',
        connected
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
        className
      )}
    >
      {isRefreshing ? (
        <RefreshCw size={10} className="animate-spin" />
      ) : (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
          )}
        />
      )}
      <span>{label}</span>
      {agoLabel && (
        <span className="opacity-60 font-normal">&middot; {agoLabel}</span>
      )}
    </div>
  );
}
