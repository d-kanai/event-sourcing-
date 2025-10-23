import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { semanticHeading, semanticText } from "@/design-system/semantic";

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: 1 | 2 | 3 | 4;
};

export function Heading({ level = 1, className, ...props }: HeadingProps) {
  const Component = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
  return (
    <Component
      className={cn(semanticHeading[level], className)}
      {...props}
    />
  );
}

export type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  tone?: keyof typeof semanticText.tone;
  size?: keyof typeof semanticText.size;
};

export function Text({
  className,
  tone = "muted",
  size = "md",
  ...props
}: TextProps) {
  return (
    <p
      className={cn(
        semanticText.size[size],
        semanticText.tone[tone],
        className,
      )}
      {...props}
    />
  );
}
