import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Connection } from '../health/types/health.types';

@Injectable()
export class RedisService implements Connection, OnModuleDestroy {
  readonly name = 'redis';
  readonly enabled: boolean;
  private readonly redis?: Redis;

  constructor(configService: ConfigService) {
    const host = configService.get<string>('services.redis.host', '');
    const password = configService.get<string>('services.redis.password');
    this.enabled = Boolean(host);
    if (host) this.redis = new Redis({ host, password, lazyConnect: true });
  }

  get client(): Redis {
    if (!this.redis)
      throw new ServiceUnavailableException('Сервис не настроен: REDIS_HOST');
    return this.redis;
  }

  ping() {
    return this.client.ping();
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => undefined);
  }
}
