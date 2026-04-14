import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      helperText,
      error,
      options,
      placeholder,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id ?? React.useId();
    const hasError = Boolean(error);

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              "text-sm font-medium leading-none",
              hasError ? "text-rose-600" : "text-slate-700",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        {/* Select wrapper */}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              "w-full appearance-none rounded-lg border bg-white text-sm text-slate-900",
              "h-10 px-3 py-2 pr-9",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400",
              hasError
                ? "border-rose-400 focus:ring-rose-500/30 focus:border-rose-400"
                : "border-slate-200 hover:border-slate-300",
              disabled && "opacity-50 cursor-not-allowed bg-slate-50",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron icon */}
          <span className="absolute right-3 flex items-center text-slate-400 pointer-events-none">
            <ChevronDown size={16} />
          </span>
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

Select.displayName = "Select";

export { Select };
