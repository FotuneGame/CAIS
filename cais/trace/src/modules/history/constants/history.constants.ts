export const IDLE = 'idle';

export const REWARDS: Record<string, number> = {
  'run:done': 1,
  'run:failed': -1,
  'step:ALLOW': 0.1,
  'step:ESCALATE': -0.3,
  'step:BLOCK': -0.3,
  violation: -0.2,
  injection: -0.5,
  'decision:ESCALATE': -0.1,
  'job:done': 0.5,
  'job:failed': -0.5,
};

export const STATES = ['negative', 'neutral', 'positive'] as const;

export const NEUTRAL = 1e-9;
