export type Synergy = { pair: [string, string]; sigma: number };

export type Collective = {
  si: number;
  cs: number;
  ii: number;
  interactions: Synergy[];
  synergy: Synergy[];
};

export type Outcome = (coalition: number[]) => number;
