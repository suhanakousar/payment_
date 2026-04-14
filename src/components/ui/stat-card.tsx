import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  accentColor?: string;
  hoverable?: boolean;
}

function StatCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  iconBg = "bg-indigo-50",
  iconColor = "text-indigo-600",
  accentColor = "from-indigo-500 to-violet-500",
  hoverable = true,
  className,
  ...props
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isFlat     = change !== undefined && change === 0;

  const ChangeIcon  = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const changeColor = isPositive ? "text-emerald-700" : isNegative ? "text-rose-600" : "text-slate-400";
  const changeBg    = isPositive ? "bg-emerald-50 border-emerald-100" : isNegative ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100";
  const absChange   = change !== undefined ? Math.abs(change) : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white",
        hoverable && "card-hover",
        className
      )}
      style={{
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 2px 12px rgba(99,102,241,0.07), 0 1px 3px rgba(0,0,0,0.05)',
      }}
      {...props}
    >
      {/* Top accent gradient */}
      <div className={cn("absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r", accentColor)} />

      {/* Faint decorative circle */}
      <div
        className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)' }}
      />

      <div className="p-5 pt-6">
        {/* Title + Icon */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 leading-none">
            {title}
          </p>
          {icon && (
            <div
              className={cn(
                "shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl",
                iconBg, iconColor
              )}
              style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.1)' }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <p className="mt-3 text-[1.75rem] font-extrabold text-slate-900 leading-none tracking-tight tabular-nums">
          {value}
        </p>

        {/* Change badge */}
        {change !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border",
                changeColor, changeBg
              )}
            >
              <ChangeIcon size={11} strokeWidth={2.5} />
              {isFlat ? "0%" : `${absChange?.toFixed(1)}%`}
            </span>
            <span className="text-[11px] text-slate-400">{changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export { StatCard };
