import type { Action } from '../../agent/types/agent.types';

export type Axiom = [string, (action: Action) => boolean];
