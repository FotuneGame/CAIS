import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElasticService {
  private readonly url: string;

  constructor(configService: ConfigService) {
    this.url = configService.get<string>('elasticsearch.url', '');
  }

  request<T>(method: string, path: string, body?: object): Promise<T> {
    const json = body === undefined ? undefined : JSON.stringify(body);
    return this.send<T>(method, path, 'application/json', json);
  }

  bulk(lines: string[]) {
    return this.send<{ errors: boolean }>(
      'POST',
      '/_bulk?refresh=true',
      'application/x-ndjson',
      `${lines.join('\n')}\n`,
    );
  }

  async exists(path: string) {
    const res = await fetch(`${this.url}${path}`, { method: 'HEAD' });
    return res.ok;
  }

  private async send<T>(
    method: string,
    path: string,
    type: string,
    body?: string,
  ): Promise<T> {
    const res = await fetch(`${this.url}${path}`, {
      method,
      headers: { 'Content-Type': type },
      body,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Elasticsearch ${res.status}: ${text.slice(0, 300)}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }
}
