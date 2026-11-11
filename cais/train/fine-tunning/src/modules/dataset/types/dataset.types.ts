export type ChatMessage = { role: string; content: string };

export type ChatRecord = {
  messages?: ChatMessage[];
  prompt?: string;
  completion?: string;
};
