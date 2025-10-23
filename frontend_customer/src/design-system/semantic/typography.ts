export const semanticHeading = {
  1: "text-3xl font-semibold",
  2: "text-2xl font-semibold",
  3: "text-xl font-semibold",
  4: "text-lg font-semibold",
} as const;

export const semanticText = {
  size: {
    sm: "text-sm",
    md: "text-base",
  },
  tone: {
    default: "text-foreground",
    muted: "text-text-secondary",
  },
} as const;

export type SemanticHeading = typeof semanticHeading;
export type SemanticText = typeof semanticText;
