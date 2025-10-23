import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  title?: ReactNode;
  description?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Card({
  title,
  description,
  header,
  footer,
  className,
  children,
}: CardProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-card p-6 shadow-card",
        className,
      )}
    >
      {header ?? (
        title || description ? (
          <header className="space-y-1">
            {title ? (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-text-secondary">{description}</p>
            ) : null}
          </header>
        ) : null
      )}

      <div className="flex-1 space-y-[var(--ds-space-element-gap)]">{children}</div>

      {footer ? <footer className="pt-2">{footer}</footer> : null}
    </section>
  );
}
