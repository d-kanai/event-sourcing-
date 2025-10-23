import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type AlertTone = "success" | "danger" | "info";

const toneClassMap: Record<AlertTone, string> = {
  success: "bg-status-success/10 text-status-success",
  danger: "bg-status-danger/10 text-status-danger",
  info: "bg-status-info/10 text-status-info",
};

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone;
};

export function Alert({ className, tone = "info", ...props }: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-md px-4 py-3 text-sm",
        toneClassMap[tone],
        className,
      )}
      role="status"
      {...props}
    />
  );
}
