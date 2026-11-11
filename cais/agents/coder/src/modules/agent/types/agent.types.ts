import type { Message } from '../../../shared/llm/types/llm.types';

export type Goal = { task: string; goal: string; criteria: string[] };

export type Action = {
  thought?: string;
  tool?: string;
  args?: Record<string, string>;
  answer?: string;
};

export type Tool = {
  args: string[];
  description: string;
  run: (args: Record<string, string>) => Promise<string>;
};

export type Tools = Record<string, Tool>;

export type Step = {
  tool: string;
  args: unknown;
  decision: string;
  output: string;
};

export type Review = { passed: boolean; note: string };

export type Verdict = { decision: string; reason?: string };

export type ActContext = {
  run: string;
  root: string;
  tools: Tools;
  messages: Message[];
  steps: Step[];
};

export type AgentResult = {
  goal: Goal;
  answer: string | null;
  passed: boolean;
  review: string;
  steps: Step[];
  sandbox: string;
};
