import { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  hint?: string;
};

export function Label({ className, children, hint, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1 text-sm font-medium text-foreground",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {hint ? <span className="text-xs font-normal text-text-secondary">{hint}</span> : null}
    </label>
  );
}
