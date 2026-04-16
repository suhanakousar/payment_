import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold rounded-full border",
  {
    variants: {
      variant: {
        default:  "bg-[rgba(255,255,255,0.06)] text-slate-300 border-[rgba(255,255,255,0.1)]",
        success:  "bg-[rgba(52,211,153,0.12)] text-emerald-300 border-[rgba(52,211,153,0.25)]",
        error:    "bg-[rgba(248,113,113,0.12)] text-rose-300 border-[rgba(248,113,113,0.25)]",
        warning:  "bg-[rgba(252,211,77,0.12)] text-yellow-300 border-[rgba(252,211,77,0.25)]",
        info:     "bg-[rgba(34,211,238,0.12)] text-cyan-300 border-[rgba(34,211,238,0.25)]",
        pending:  "bg-[rgba(167,139,250,0.12)] text-violet-300 border-[rgba(167,139,250,0.25)]",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const dotColors: Record<string, string> = {
  default: "bg-slate-400",
  success: "bg-emerald-400",
  error:   "bg-rose-400",
  warning: "bg-yellow-400",
  info:    "bg-cyan-400",
  pending: "bg-violet-400",
};

export function paymentStatusVariant(
  status: string
): VariantProps<typeof badgeVariants>["variant"] {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    success:    "success",
    succeeded:  "success",
    completed:  "success",
    active:     "success",
    captured:   "success",
    failed:     "error",
    failure:    "error",
    declined:   "error",
    refunded:   "warning",
    pending:    "pending",
    processing: "info",
    initiated:  "info",
    authorized: "info",
    cancelled:  "error",
    expired:    "default",
  };
  return map[status.toLowerCase()] ?? "default";
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size, dot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span className={cn("status-dot shrink-0", dotColors[variant ?? "default"])} />
      )}
      {children}
    </span>
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
