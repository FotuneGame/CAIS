import type { Verbosity } from '../types/macie.types';

export const MACIE_DEFAULTS = {
  k: 10,
  b: 200,
  epsilon: 0.5,
  synergy: 0.1,
  si: 0.1,
  seed: 42,
  shapley: true,
  verbosity: 'detailed' as Verbosity,
};

export const VERBOSITY = ['concise', 'detailed', 'full'] as const;

export const CRITICAL_SHOWN = 3;
