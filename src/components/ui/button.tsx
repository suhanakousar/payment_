"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none cursor-pointer",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-indigo-500 to-violet-500 text-white",
          "hover:from-indigo-600 hover:to-violet-600",
          "active:from-indigo-700 active:to-violet-700",
          "shadow-sm hover:shadow-md hover:shadow-indigo-200",
          "focus-visible:ring-indigo-500",
        ],
        secondary: [
          "bg-white text-slate-700 border border-slate-200",
          "hover:bg-slate-50 hover:border-slate-300",
          "active:bg-slate-100",
          "shadow-sm hover:shadow-md",
          "focus-visible:ring-slate-400",
        ],
        success: [
          "bg-teal-500 text-white",
          "hover:bg-teal-600",
          "active:bg-teal-700",
          "shadow-sm hover:shadow-md hover:shadow-teal-200",
          "focus-visible:ring-teal-500",
        ],
        danger: [
          "bg-rose-500 text-white",
          "hover:bg-rose-600",
          "active:bg-rose-700",
          "shadow-sm hover:shadow-md hover:shadow-rose-200",
          "focus-visible:ring-rose-500",
        ],
        ghost: [
          "bg-transparent text-slate-600",
          "hover:bg-slate-100 hover:text-slate-900",
          "active:bg-slate-200",
          "focus-visible:ring-slate-400",
        ],
        amber: [
          "bg-amber-500 text-white",
          "hover:bg-amber-600",
          "active:bg-amber-700",
          "shadow-sm hover:shadow-md hover:shadow-amber-200",
          "focus-visible:ring-amber-500",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md gap-1.5",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
      fullWidth: {
        true: "w-full",
      },
      iconOnly: {
        true: "p-0",
      },
    },
    compoundVariants: [
      { size: "sm", iconOnly: true, className: "w-8 h-8" },
      { size: "md", iconOnly: true, className: "w-10 h-10" },
      { size: "lg", iconOnly: true, className: "w-12 h-12" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      iconOnly,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, fullWidth, iconOnly }),
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {!iconOnly && children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
