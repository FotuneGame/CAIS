import { STATES } from '../constants/history.constants';

export type State = (typeof STATES)[number];

export type Step = {
  time: string;
  state: State;
  actions: string[];
  reward: number;
};

export type History = {
  agents: string[];
  steps: Step[];
};
