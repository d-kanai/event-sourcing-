import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type StackProps = HTMLAttributes<HTMLDivElement> & {
  gap?: "xs" | "sm" | "md" | "lg";
  direction?: "vertical" | "horizontal";
};

const gapClassMap: Record<NonNullable<StackProps["gap"]>, string> = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
};

export function Stack({
  className,
  gap = "md",
  direction = "vertical",
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row",
        gapClassMap[gap],
        className,
      )}
      {...props}
    />
  );
}
