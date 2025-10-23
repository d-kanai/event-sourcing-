import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useId,
} from "react";
import { cn } from "@/lib/cn";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: ReactNode;
  hint?: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex w-full cursor-pointer select-none items-start gap-3 text-sm text-foreground",
          props.disabled && "cursor-not-allowed opacity-70",
          className,
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cn(
            "mt-0.5 h-5 w-5 rounded-[var(--radius-sm)] border border-border-subtle text-surface-brand transition duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/40",
            "accent-surface-brand disabled:cursor-not-allowed",
          )}
          {...props}
        />

        <span className="flex flex-col gap-1">
          {label ? <span className="font-medium">{label}</span> : null}
          {hint ? (
            <span className="text-xs text-text-secondary">{hint}</span>
          ) : null}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
