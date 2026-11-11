import { Client } from '@elastic/elasticsearch';
import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection } from '../health/types/health.types';

@Injectable()
export class ElasticService implements Connection, OnModuleDestroy {
  readonly name = 'elasticsearch';
  readonly enabled: boolean;
  private readonly elastic?: Client;

  constructor(configService: ConfigService) {
    const node = configService.get<string>('services.elasticsearch.url', '');
    this.enabled = Boolean(node);
    if (node) this.elastic = new Client({ node });
  }

  get client(): Client {
    if (!this.elastic) {
      throw new ServiceUnavailableException(
        'Сервис не настроен: ELASTICSEARCH_URL',
      );
    }
    return this.elastic;
  }

  ping() {
    return this.client.ping();
  }

  async onModuleDestroy() {
    await this.elastic?.close();
  }
}
