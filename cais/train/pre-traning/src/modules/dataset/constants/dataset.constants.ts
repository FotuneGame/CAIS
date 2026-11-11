export const CHAT_TEMPLATE = {
  start: (role: string) => `<|im_start|>${role}\n`,
  end: '<|im_end|>\n',
};

export const TEXT_EXTENSIONS = ['.txt', '.md'];

export const CHAT_EXTENSIONS = ['.jsonl'];
