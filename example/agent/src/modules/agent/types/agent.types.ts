export type Action = {
  thought?: string;
  tool?: string;
  input?: string;
  answer?: string;
};

export type Step = Action & { observation: string };
