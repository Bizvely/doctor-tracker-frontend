"use client";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hideLabel?: boolean;
}

// <option> গুলো children হিসেবে দিতে হয়
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hideLabel = false, className, id, children, ...rest },
  ref
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={className}>
      <label htmlFor={selectId} className={cn("mb-1.5 block text-sm font-medium text-slate-700", hideLabel && "sr-only")}>
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900",
          "focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-200"
            : "border-slate-300 focus:border-brand-600 focus:ring-brand-200"
        )}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
});
