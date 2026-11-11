export const METHODS = ['support', 'jaccard', 'lift', 'phi'] as const;

export type MethodName = (typeof METHODS)[number];
