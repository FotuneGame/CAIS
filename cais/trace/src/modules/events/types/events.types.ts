export type Event = {
  time: string;
  agent: string;
  type: string;
  run?: string;
  tool?: string;
  decision?: string;
  status?: string;
  durationMs?: number;
};

export type EventFilter = { agent?: string; minutes?: number; limit?: number };

export type EventRow = Required<Omit<Event, 'durationMs'>> & {
  durationMs: number | null;
};
