import { Global, INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import appConfig from '../src/config/app.config';
import clickhouseConfig from '../src/config/clickhouse.config';
import kafkaConfig from '../src/config/kafka.config';
import servicesConfig from '../src/config/services.config';
import { ClickHouseModule } from '../src/shared/clickhouse/clickhouse.module';
import { ElasticModule } from '../src/shared/elastic/elastic.module';
import { HealthModule } from '../src/shared/health/health.module';
import { KafkaModule } from '../src/shared/kafka/kafka.module';
import { LlmModule } from '../src/shared/llm/llm.module';
import { RedisModule } from '../src/shared/redis/redis.module';
import { S3Module } from '../src/shared/s3/s3.module';

const query = jest.fn();

@Global()
@Module({
  providers: [{ provide: DataSource, useValue: { query } }],
  exports: [DataSource],
})
class FakeDatabaseModule {}

describe('health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [appConfig, kafkaConfig, clickhouseConfig, servicesConfig],
        }),
        FakeDatabaseModule,
        RedisModule,
        ClickHouseModule,
        ElasticModule,
        KafkaModule,
        S3Module,
        LlmModule,
        HealthModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /health/live — процесс отвечает', () =>
    request(app.getHttpServer())
      .get('/health/live')
      .expect(200, { status: 'ok' }));

  it('GET /health — PostgreSQL доступен, выключенные сервисы disabled', async () => {
    query.mockResolvedValue([]);
    const { body } = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(body.services.postgres).toBe('ok');
    expect(body.services.redis).toBe('disabled');
  });

  it('GET /health — ошибка PostgreSQL даёт 503', async () => {
    query.mockRejectedValue(new Error('нет связи'));
    const { body } = await request(app.getHttpServer())
      .get('/health')
      .expect(503);
    expect(body.services.postgres).toBe('error: нет связи');
  });
});
