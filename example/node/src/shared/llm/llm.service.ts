import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServicesConfig } from '../../config/services.config';
import { Connection } from '../health/types/health.types';
import { Completion } from './types/llm.types';

@Injectable()
export class LlmService implements Connection {
  readonly name = 'llm';
  readonly enabled: boolean;
  private readonly config: ServicesConfig['llm'];

  constructor(configService: ConfigService) {
    this.config =
      configService.getOrThrow<ServicesConfig['llm']>('services.llm');
    this.enabled = Boolean(this.config.url);
  }

  async chat(prompt: string): Promise<string> {
    const response = await fetch(`${this.url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(`LLM: HTTP ${response.status}`);
    const data = (await response.json()) as Completion;
    return data.choices[0].message.content;
  }

  async ping() {
    const response = await fetch(`${this.url}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }

  private get url() {
    if (!this.config.url)
      throw new ServiceUnavailableException('Сервис не настроен: LLM_URL');
    return this.config.url;
  }
}
