export type Fact = {
  id: string;
  title: string;
  text: string;
  injection: boolean;
  reviewed: boolean;
};

export type Hit = Fact & { score: number };

export type FactsInfo = {
  title: string;
  chunks: number;
  injection: boolean;
  reviewed: boolean;
};
