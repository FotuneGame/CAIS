import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access, constants, mkdir } from 'node:fs/promises';
import { DataSource } from 'typeorm';
import { ClickHouseService } from '../clickhouse/clickhouse.service';
import { ElasticService } from '../elastic/elastic.service';
import { KafkaService } from '../kafka/kafka.service';
import { LlmService } from '../llm/llm.service';
import { RedisService } from '../redis/redis.service';
import { S3Service } from '../s3/s3.service';
import { Connection } from './types/health.types';

@Injectable()
export class HealthService {
  private readonly connections: Connection[];

  constructor(
    dataSource: DataSource,
    redis: RedisService,
    clickhouse: ClickHouseService,
    elastic: ElasticService,
    kafka: KafkaService,
    s3: S3Service,
    llm: LlmService,
    configService: ConfigService,
  ) {
    const dir = configService.get<string>('app.appDataPath', './app-data');
    this.connections = [
      {
        name: 'postgres',
        enabled: true,
        ping: () => dataSource.query('SELECT 1'),
      },
      redis,
      clickhouse,
      elastic,
      kafka,
      s3,
      llm,
      {
        name: 'app-data',
        enabled: true,
        ping: async () => {
          await mkdir(dir, { recursive: true });
          await access(dir, constants.W_OK);
        },
      },
    ];
  }

  async check() {
    const states = await Promise.all(
      this.connections.map(
        async (c) => [c.name, await this.status(c)] as const,
      ),
    );
    return Object.fromEntries(states);
  }

  private async status(connection: Connection) {
    if (!connection.enabled) return 'disabled';
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('нет ответа 5 с')), 5000).unref(),
    );
    try {
      await Promise.race([connection.ping(), timeout]);
      return 'ok';
    } catch (error) {
      return `error: ${(error as Error).message}`;
    }
  }
}
