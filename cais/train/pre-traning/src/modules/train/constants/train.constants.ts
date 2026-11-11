import type { GgufOptions, TrainMode } from '../../gguf/types/gguf.types';

export const TRAIN_MODE: TrainMode = 'text';

export const TRAIN_DEFAULTS: GgufOptions = {
  context: 512,
  batch: 512,
  epochs: 2,
  lr: 1e-5,
  quantize: 'Q4_K_M',
  evaluate: true,
};
