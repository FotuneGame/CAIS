export type Belief = { belief: Record<string, number>; ignorance: number };

export type Evidence = {
  consequent: Record<string, number>;
  weight: number;
  completeness: number;
};
