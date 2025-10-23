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
        <span className="relative flex h-5 w-5 items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer absolute h-full w-full cursor-pointer appearance-none rounded-[var(--radius-sm)] border border-border-subtle bg-surface-card transition duration-150 focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/40 disabled:cursor-not-allowed"
            {...props}
          />
          <span className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] bg-surface-brand text-text-on-brand opacity-0 transition duration-150 peer-checked:opacity-100">
            ✓
          </span>
        </span>

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
