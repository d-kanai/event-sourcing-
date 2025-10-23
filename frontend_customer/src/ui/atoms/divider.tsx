import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type DividerProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

export function Divider({
  className,
  orientation = "horizontal",
  ...props
}: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === "vertical"
          ? "mx-4 h-full w-px bg-border-subtle"
          : "h-px w-full bg-border-subtle",
        className,
      )}
      {...props}
    />
  );
}
