import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmConfig } from '../../config/llm.config';
import { Completion, Message } from './types/llm.types';

@Injectable()
export class LlmService {
  private readonly config: LlmConfig;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<LlmConfig>('llm');
  }

  async chat(messages: Message[]): Promise<Record<string, unknown>> {
    const { url, maxTokens, timeoutMs } = this.config;
    const res = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    }).catch((error: Error) => {
      throw new Error(
        error.name === 'TimeoutError'
          ? `LLM не ответила за ${timeoutMs / 1000} с`
          : `LLM недоступна: ${error.message}`,
      );
    });
    if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
    const { choices } = (await res.json()) as Completion;
    const content = choices[0].message.content;
    const json = content.slice(
      content.indexOf('{'),
      content.lastIndexOf('}') + 1,
    );
    return JSON.parse(json || content) as Record<string, unknown>;
  }
}
