export type Trace = {
  action: string | null;
  hypothesis: string | null;
  belief: Record<string, number>;
  ignorance: number;
  conflict: number;
  rules: { id: string; activation: number; reviewed: boolean }[];
};
