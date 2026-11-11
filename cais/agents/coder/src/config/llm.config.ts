import { registerAs } from '@nestjs/config';

export interface LlmConfig {
  url: string;
  maxTokens: number;
  timeoutMs: number;
}

export default registerAs('llm', (): LlmConfig => ({
  url: process.env.LLM_URL || 'http://localhost:81/dev/llama',
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2048', 10),
  timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || '180000', 10),
}));
