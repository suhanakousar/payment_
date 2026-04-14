import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small label above the value */
  title: string;
  /** Main KPI value (string allows formatting like "$12,400") */
  value: string | number;
  /**
   * Percentage change from previous period.
   * Positive = up (green), negative = down (red), 0 = flat (slate).
   */
  change?: number;
  /** Contextual label next to the change, e.g. "vs last month" */
  changeLabel?: string;
  /** Icon rendered inside the colored circle */
  icon?: React.ReactNode;
  /**
   * Background color of the icon circle.
   * Defaults to an indigo tint.
   */
  iconBg?: string;
  /** Accent gradient line color – defaults to indigo→violet */
  accentColor?: string;
  /** Enable card-hover lift effect */
  hoverable?: boolean;
}

function StatCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  iconBg = "bg-indigo-50",
  accentColor = "from-indigo-500 to-violet-500",
  hoverable = true,
  className,
  ...props
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isFlat     = change !== undefined && change === 0;

  const changeColor = isPositive
    ? "text-teal-600"
    : isNegative
    ? "text-rose-500"
    : "text-slate-400";

  const ChangeIcon = isPositive
    ? TrendingUp
    : isNegative
    ? TrendingDown
    : Minus;

  const absChange = change !== undefined ? Math.abs(change) : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white border border-slate-100",
        "shadow-[var(--shadow-sm)] p-6",
        hoverable && "card-hover",
        className
      )}
      {...props}
    >
      {/* Gradient accent line at top */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r",
          accentColor
        )}
      />

      {/* Top section: label + icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            {title}
          </p>
          {/* Value */}
          <p className="text-2xl font-bold text-slate-900 leading-none tracking-tight truncate">
            {value}
          </p>
        </div>

        {/* Icon circle */}
        {icon && (
          <div
            className={cn(
              "shrink-0 flex items-center justify-center",
              "w-11 h-11 rounded-full",
              iconBg
            )}
          >
            <span className="text-indigo-600">{icon}</span>
          </div>
        )}
      </div>

      {/* Change row */}
      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold",
              changeColor
            )}
          >
            <ChangeIcon size={13} strokeWidth={2.5} />
            {isFlat ? "0%" : `${absChange?.toFixed(1)}%`}
          </span>
          <span className="text-xs text-slate-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

export { StatCard };
