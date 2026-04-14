import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      disabled,
      type = "text",
      ...props
    },
    ref
  ) => {
    const inputId = id ?? React.useId();
    const hasError = Boolean(error);

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none",
              hasError ? "text-rose-600" : "text-slate-700",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left icon */}
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-slate-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              "w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400",
              "h-10 px-3 py-2",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400",
              hasError
                ? "border-rose-400 focus:ring-rose-500/30 focus:border-rose-400"
                : "border-slate-200 hover:border-slate-300",
              disabled && "opacity-50 cursor-not-allowed bg-slate-50",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <span className="absolute right-3 flex items-center text-slate-400 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Helper / Error text */}
        {(helperText || error) && (
          <p
            className={cn(
              "text-xs leading-relaxed",
              hasError ? "text-rose-500" : "text-slate-500"
            )}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
