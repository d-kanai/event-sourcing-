import { primitiveColors } from "../primitive";

export const semanticColors = {
  surface: {
    page: primitiveColors.neutral[50],
    card: primitiveColors.neutral[0],
    overlay: primitiveColors.neutral[900] + "cc",
    brand: primitiveColors.brand[600],
  },
  text: {
    primary: primitiveColors.neutral[900],
    secondary: primitiveColors.neutral[600],
    inverse: primitiveColors.neutral[50],
    onBrand: primitiveColors.neutral[50],
  },
  border: {
    subtle: primitiveColors.neutral[200],
    strong: primitiveColors.neutral[400],
    focus: primitiveColors.brand[500],
  },
  status: {
    success: primitiveColors.success[500],
    warning: primitiveColors.warning[500],
    danger: primitiveColors.danger[500],
    info: primitiveColors.blue[500],
  },
} as const;

export type SemanticColors = typeof semanticColors;
