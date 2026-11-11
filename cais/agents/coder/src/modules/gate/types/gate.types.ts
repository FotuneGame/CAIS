export type EbrbAnswer = {
  decision: 'APPROVE' | 'REFINE' | 'ESCALATE';
  hypothesis?: string | null;
  reason?: string;
  explanation?: string | null;
};
