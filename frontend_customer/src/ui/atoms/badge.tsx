import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "surface" | "brand";

const variantClassMap: Record<BadgeVariant, string> = {
  surface:
    "bg-surface-overlay text-text-secondary",
  brand:
    "bg-surface-brand text-text-on-brand",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "surface", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center justify-center rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variantClassMap[variant],
        className,
      )}
      {...props}
    />
  );
}
