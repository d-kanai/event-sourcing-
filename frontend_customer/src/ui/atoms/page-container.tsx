import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PageContainerProps = {
  children: ReactNode;
  width?: "md" | "lg";
  className?: string;
};

const widthClassMap: Record<NonNullable<PageContainerProps["width"]>, string> = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
};

export function PageContainer({
  children,
  width = "md",
  className,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-screen w-full flex-col gap-[var(--spacing-section-gap)] bg-background px-[var(--spacing-page-x)] py-[var(--spacing-page-y)] text-foreground",
        widthClassMap[width],
        className,
      )}
    >
      {children}
    </main>
  );
}
