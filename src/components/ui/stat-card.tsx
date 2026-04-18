import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  accentFrom?: string;
  accentTo?: string;
  glowColor?: string;
}

function StatCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  accentFrom = "#22D3EE",
  accentTo   = "#A78BFA",
  glowColor  = "rgba(34,211,238,0.15)",
  className,
  ...props
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isFlat     = change !== undefined && change === 0;

  const ChangeIcon  = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const changeStyle = isPositive
    ? { color: '#34D399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }
    : isNegative
    ? { color: '#F87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }
    : { color: '#94A3B8', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' };

  const absChange = change !== undefined ? Math.abs(change) : undefined;

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl card-hover", className)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
      {...props}
    >
      {/* Top accent gradient bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})` }}
      />

      {/* Glow orb bottom right */}
      <div
        className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />

      <div className="p-5 pt-6">
        {/* Title + Icon */}
        <div className="flex items-start justify-between gap-3">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em] leading-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            {title}
          </p>
          {icon && (
            <div
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${accentFrom}20, ${accentTo}20)`,
                border: `1px solid ${accentFrom}30`,
              }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <p
          className="mt-3 text-[1.7rem] font-extrabold leading-none tracking-tight tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </p>

        {/* Change badge */}
        {change !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
              style={changeStyle}
            >
              <ChangeIcon size={11} strokeWidth={2.5} />
              {isFlat ? "0%" : `${absChange?.toFixed(1)}%`}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {changeLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export { StatCard };
