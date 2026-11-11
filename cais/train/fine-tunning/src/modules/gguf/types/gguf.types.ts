export type Log = (entry: object) => void;

export type TrainMode = 'text' | 'chat';

export type GgufOptions = {
  context: number;
  batch: number;
  epochs: number;
  lr: number;
  quantize: string | null;
  evaluate: boolean;
};

export type GgufTask = {
  base: string;
  dataset: string;
  output: string;
  mode: TrainMode;
  options: GgufOptions;
};

export type Trained = {
  file: string;
  quantized: string | null;
  metrics: Record<string, number>;
};
