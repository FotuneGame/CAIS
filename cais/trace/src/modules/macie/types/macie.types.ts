import type { Collective } from '../../collective/types/collective.types';

export type AgentEffect = {
  agent: string;
  phi: number;
  ate: number;
  share: number;
  ci: [number, number];
  counterfactual: number;
  critical: string[];
};

export type MacieReport = {
  agents: string[];
  steps: number;
  outcome: number;
  model: { r2: number; edges: [string, string][] };
  effects: AgentEffect[];
  collective: Collective;
  efficiency: { gain: number; shapley: number; residual: number };
  emergence: boolean;
  explanation: string[];
};

export type Verbosity = 'concise' | 'detailed' | 'full';

export type MacieOptions = {
  minutes?: number;
  k: number;
  b: number;
  epsilon: number;
  synergy: number;
  si: number;
  seed: number;
  shapley: boolean;
  m: number | null;
  verbosity: Verbosity;
};
