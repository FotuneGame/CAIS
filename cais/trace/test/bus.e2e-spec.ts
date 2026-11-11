import { INestApplication } from '@nestjs/common';
import { ClickHouseService } from '../src/shared/clickhouse/clickhouse.service';
import { busCall } from './bus';
import { testModule } from './module';

describe('trace по шине Kafka', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.AUTH_DISABLED = 'true';
    const moduleRef = await testModule()
      .overrideProvider(ClickHouseService)
      .useValue({
        exec: () => Promise.resolve(),
        query: () => Promise.resolve([]),
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('report: отчёт приходит ответом на запрос', async () => {
    const [[topic, reply]] = await busCall(app, 'report', { minutes: 60 });
    expect(topic).toBe('cais.mcp.replies');
    expect(reply).toMatchObject({ id: 'r1', ok: true });
  });

  it('report: minutes вне диапазона отклоняется', async () => {
    const [[, reply]] = await busCall(app, 'report', { minutes: 0 });
    expect(reply.ok).toBe(false);
  });
});
