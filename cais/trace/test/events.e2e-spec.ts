import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { testModule } from './module';
import { ClickHouseService } from '../src/shared/clickhouse/clickhouse.service';

describe('trace API', () => {
  const rows: Record<string, unknown>[] = [];
  const clickhouse = {
    exec: jest.fn(() => Promise.resolve()),
    insert: jest.fn((_table: string, values: Record<string, unknown>[]) => {
      rows.push(...values);
      return Promise.resolve();
    }),
    query: jest.fn(() =>
      Promise.resolve(rows.map((row) => ({ ...row, time: String(row.time) }))),
    ),
  };
  let app: INestApplication;
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    process.env.AUTH_DISABLED = 'true';
    const moduleRef = await testModule()
      .overrideProvider(ClickHouseService)
      .useValue(clickhouse)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('событие сохраняется в ClickHouse и попадает в отчёт', async () => {
    await request(server())
      .post('/events')
      .send({ agent: 'coder', type: 'step', tool: 'read', run: 'r1' })
      .expect(201);
    expect(clickhouse.exec).toHaveBeenCalled();
    const { body } = await request(server())
      .post('/report')
      .send({ minutes: 60 })
      .expect(200);
    expect(body.agents.coder.events).toBe(1);
  });

  it('событие без агента отклоняется', () =>
    request(server()).post('/events').send({ type: 'step' }).expect(400));
});
