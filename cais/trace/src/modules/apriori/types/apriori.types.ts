export type Itemset = { items: string[]; support: number };

export type Edge = { source: string; target: string; weight: number };

export type Matrix = { factors: string[]; values: number[][] };

export type Method = {
  name: string;
  theta: number;
  wcss: number;
  delta: number;
};
