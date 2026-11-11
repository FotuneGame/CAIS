export type Extracted = Record<string, { value: number; confidence: number }>;

export type Match = {
  similarity: Record<string, number>;
  completeness: number;
};
