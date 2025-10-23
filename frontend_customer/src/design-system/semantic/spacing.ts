import { primitiveSpacing } from "../primitive";

export const semanticSpacing = {
  pageX: primitiveSpacing[6],
  pageY: primitiveSpacing[8],
  sectionGap: primitiveSpacing[10],
  elementGap: primitiveSpacing[4],
  controlPaddingX: primitiveSpacing[4],
  controlPaddingY: primitiveSpacing[3],
} as const;

export type SemanticSpacing = typeof semanticSpacing;
