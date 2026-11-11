export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type Completion = { choices: { message: { content: string } }[] };
