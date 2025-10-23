import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full rounded-md border border-border-subtle bg-surface-card px-[var(--spacing-control-x)] py-[var(--spacing-control-y)] text-base text-foreground shadow-card/10 transition duration-150",
          "focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/40",
          "placeholder:text-text-secondary/70",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
