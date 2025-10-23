import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full rounded-md border border-border-subtle bg-surface-card px-[var(--spacing-control-x)] py-[var(--spacing-control-y)] text-base text-foreground shadow-card/10 transition duration-150",
          "focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/40",
          "placeholder:text-text-secondary/70",
          "disabled:cursor-not-allowed disabled:bg-surface-overlay/40 disabled:text-text-secondary",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
