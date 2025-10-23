export * as primitiveTokens from "./primitive";
export * as semanticTokens from "./semantic";

export const cssVar = (token: string) => `var(--ds-${token})`;
