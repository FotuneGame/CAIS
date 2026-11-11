import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickHouseConfig } from '../../config/clickhouse.config';
import { Params } from './types/clickhouse.types';

@Injectable()
export class ClickHouseService {
  private readonly config: ClickHouseConfig;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<ClickHouseConfig>('clickhouse');
  }

  async query<T>(sql: string, params: Params = {}): Promise<T[]> {
    const text = await this.send(`${sql} FORMAT JSONEachRow`, params);
    return text
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  }

  async insert(table: string, rows: object[]) {
    if (!rows.length) return;
    const lines = rows.map((row) => JSON.stringify(row)).join('\n');
    await this.send(`INSERT INTO ${table} FORMAT JSONEachRow\n${lines}`);
  }

  async exec(sql: string) {
    await this.send(sql);
  }

  private async send(body: string, params: Params = {}) {
    const { url, username, password, database } = this.config;
    if (!url) throw new Error('ClickHouse не настроен: CLICKHOUSE_URL');
    const search = new URLSearchParams({ database });
    for (const [name, value] of Object.entries(params)) {
      search.set(`param_${name}`, String(value));
    }
    const res = await fetch(`${url}/?${search}`, {
      method: 'POST',
      headers: { 'X-ClickHouse-User': username, 'X-ClickHouse-Key': password },
      body,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`ClickHouse ${res.status}: ${text.slice(0, 300)}`);
    }
    return text;
  }
}
