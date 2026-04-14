import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium rounded-full",
  {
    variants: {
      variant: {
        default:  "bg-slate-100 text-slate-700",
        success:  "bg-teal-50 text-teal-700",
        error:    "bg-rose-50 text-rose-600",
        warning:  "bg-amber-50 text-amber-700",
        info:     "bg-indigo-50 text-indigo-700",
        pending:  "bg-slate-100 text-slate-500",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
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
  success: "bg-teal-500",
  error:   "bg-rose-500",
  warning: "bg-amber-500",
  info:    "bg-indigo-500",
  pending: "bg-slate-400",
};

/**
 * Maps common payment status strings to badge variants.
 */
export function paymentStatusVariant(
  status: string
): VariantProps<typeof badgeVariants>["variant"] {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    success:    "success",
    succeeded:  "success",
    completed:  "success",
    active:     "success",
    failed:     "error",
    failure:    "error",
    declined:   "error",
    refunded:   "warning",
    pending:    "pending",
    processing: "info",
    initiated:  "info",
    cancelled:  "error",
    expired:    "pending",
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
        <span
          className={cn(
            "status-dot shrink-0",
            dotColors[variant ?? "default"]
          )}
        />
      )}
      {children}
    </span>
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
