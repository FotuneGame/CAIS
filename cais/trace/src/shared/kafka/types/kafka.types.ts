export type Listener = (value: string) => Promise<void> | void;

export type BusRequest = {
  id: string;
  replyTo: string;
  action: string;
  deadline: number;
  token?: string;
  body: unknown;
};

export type BusReply = {
  id: string;
  ok: boolean;
  data?: unknown;
  error?: string;
};
