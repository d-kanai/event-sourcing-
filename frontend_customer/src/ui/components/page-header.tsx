import { ReactNode } from "react";
import { Badge } from "@/ui/atoms/badge";
import { Heading, Text } from "@/ui/atoms/typography";
import { Stack } from "@/ui/atoms/stack";
import { cn } from "@/lib/cn";

export type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "space-y-[var(--ds-space-element-gap)]",
        className,
      )}
    >
      <Stack gap="sm">
        {typeof eyebrow === "string" ? (
          <Badge>{eyebrow}</Badge>
        ) : (
          eyebrow ?? null
        )}
        <div className="flex flex-col gap-2">
          <Heading>{title}</Heading>
          {description ? <Text>{description}</Text> : null}
        </div>
      </Stack>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
