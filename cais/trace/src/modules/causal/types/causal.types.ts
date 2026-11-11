import { OutcomeModel } from '../../outcome/types/outcome.types';

export type Counts = Map<string, number>;

export type CausalModel = OutcomeModel & {
  agents: string[];
  actions: string[][];
  parents: number[][];
  edges: [number, number][];
  conditionals: Map<string, Counts>[];
  marginals: Counts[];
};
