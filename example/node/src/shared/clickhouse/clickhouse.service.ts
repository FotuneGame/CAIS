import { ClickHouseClient, createClient } from '@clickhouse/client';
import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickHouseConfig } from '../../config/clickhouse.config';
import { Connection } from '../health/types/health.types';

@Injectable()
export class ClickHouseService implements Connection, OnModuleDestroy {
  readonly name = 'clickhouse';
  readonly enabled: boolean;
  private readonly clickhouse?: ClickHouseClient;

  constructor(configService: ConfigService) {
    const config = configService.getOrThrow<ClickHouseConfig>('clickhouse');
    this.enabled = Boolean(config.url);
    if (config.url) this.clickhouse = createClient(config);
  }

  get client(): ClickHouseClient {
    if (!this.clickhouse) {
      throw new ServiceUnavailableException(
        'Сервис не настроен: CLICKHOUSE_URL',
      );
    }
    return this.clickhouse;
  }

  async ping() {
    const result = await this.client.ping();
    if (!result.success) throw result.error;
  }

  async onModuleDestroy() {
    await this.clickhouse?.close();
  }
}
