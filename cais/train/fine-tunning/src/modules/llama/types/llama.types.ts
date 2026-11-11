export type FinetuneOptions = {
  model: string;
  data: string;
  output: string;
  context: number;
  batch: number;
  epochs: number;
  lr: number;
};
