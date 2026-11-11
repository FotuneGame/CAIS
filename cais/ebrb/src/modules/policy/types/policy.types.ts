export type Decision = 'APPROVE' | 'REFINE' | 'ESCALATE';

export type Thresholds = {
  confidence: number;
  ignorance: number;
  conflict: number;
};

export type Evaluation = {
  belief: Record<string, number>;
  ignorance: number;
  conflict: number;
  action: string | null;
  safe: boolean;
};
