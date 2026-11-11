import type { Log, Trained } from '../../gguf/types/gguf.types';

export type JobStatus = 'running' | 'done' | 'failed';

export type JobRequest = {
  owner: string;
  trainer: string;
  base: string | null;
  dataset: string;
  model: string;
};

export type Work = (log: Log) => Promise<Trained>;

export type JobPlan = { request: JobRequest; work: Work };
