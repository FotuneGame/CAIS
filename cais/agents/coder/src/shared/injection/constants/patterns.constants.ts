export const PATTERNS: [string, RegExp][] = [
  [
    'отмена инструкций',
    /(ignore|disregard|forget)\s+(all\s+|the\s+)?(previous|above|prior|earlier)/i,
  ],
  [
    'отмена инструкций',
    /(игнорир|забудь|отмени)\S*\s+(все\s+)?(предыдущ|прошл|выше)/i,
  ],
  ['подмена роли', /(you are now|act as|ты теперь|веди себя как)\b/i],
  [
    'системный промпт',
    /(system|developer)\s+(prompt|message)|системн\S*\s+(промпт|инструкц)/i,
  ],
  ['служебная разметка', /<\|im_(start|end)\|>|<\/?(system|assistant|data)>/i],
  [
    'вывод секретов',
    /(reveal|print|show|покажи|выведи)\s.{0,30}(secret|password|token|парол|токен|секрет)/i,
  ],
];
