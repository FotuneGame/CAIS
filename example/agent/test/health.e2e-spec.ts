import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { HealthController } from '../src/shared/health/health.controller';
import { HealthService } from '../src/shared/health/health.service';

describe('health', () => {
  const query = jest.fn();
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: DataSource, useValue: { query } },
        { provide: ConfigService, useValue: new ConfigService() },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(() => app.close());

  it('GET /health/live', () =>
    request(app.getHttpServer())
      .get('/health/live')
      .expect(200, { status: 'ok' }));

  it('GET /health — PostgreSQL доступен', async () => {
    query.mockResolvedValue([]);
    const { body } = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(body.services.postgres).toBe('ok');
  });

  it('GET /health — ошибка PostgreSQL даёт 503', async () => {
    query.mockRejectedValue(new Error('нет связи'));
    const { body } = await request(app.getHttpServer())
      .get('/health')
      .expect(503);
    expect(body.services.postgres).toBe('error: нет связи');
  });
});
