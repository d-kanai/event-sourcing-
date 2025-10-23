import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-md border border-border-subtle bg-surface-card px-[var(--spacing-control-x)] py-[var(--spacing-control-y)] text-base text-foreground shadow-card/10 transition duration-150",
            "focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/40",
            "disabled:cursor-not-allowed disabled:bg-surface-overlay/40 disabled:text-text-secondary",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-secondary">
          ▼
        </span>
      </div>
    );
  },
);

Select.displayName = "Select";
