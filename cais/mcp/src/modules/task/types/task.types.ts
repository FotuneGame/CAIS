export type Run = {
  id: string;
  status: string;
  error?: string;
  result?: {
    goal: { goal: string };
    answer: string | null;
    passed: boolean;
    review: string;
    sandbox: string;
    steps: { tool: string; decision: string }[];
  };
};
