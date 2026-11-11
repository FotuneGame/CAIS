export type RuleSource = 'expert' | 'learned';

export type RuleData = {
  id: string;
  antecedents: Record<string, number>;
  consequent: Record<string, number>;
  weight: number;
  reliability: number;
  source: RuleSource;
  reviewed: boolean;
};

export type Sample = {
  attributes: Record<string, number>;
  label: string;
};
