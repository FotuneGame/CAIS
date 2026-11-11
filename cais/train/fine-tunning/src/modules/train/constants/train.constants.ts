import type { GgufOptions, TrainMode } from '../../gguf/types/gguf.types';

export const TRAIN_MODE: TrainMode = 'chat';

export const TRAIN_DEFAULTS: GgufOptions = {
  context: 1024,
  batch: 512,
  epochs: 3,
  lr: 1e-5,
  quantize: 'Q4_K_M',
  evaluate: true,
};
