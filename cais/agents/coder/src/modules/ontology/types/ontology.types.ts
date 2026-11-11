import type { Action, Tools } from '../../agent/types/agent.types';

export type Context = { tools: Tools; root: string };

export type Axiom = [string, (action: Action, context: Context) => boolean];
