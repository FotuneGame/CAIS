import { INestApplication } from '@nestjs/common';
import { createApp } from './app';
import { busCall } from './bus';

describe('EBRB по шине Kafka', () => {
  const chat = jest.fn();
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp(chat);
  });

  afterAll(() => app.close());

  it('infer: ответ в топик replyTo с тем же id', async () => {
    const attributes = { risk: { value: 0 } };
    const [[topic, reply]] = await busCall(app, 'infer', {
      attributes,
      action: 'read',
    });
    expect(topic).toBe('cais.mcp.replies');
    expect(reply).toMatchObject({ id: 'r1', ok: true });
    expect(reply.data).toHaveProperty('decision');
  });

  it('тело проверяется тем же DTO, что и HTTP', async () => {
    const [[, reply]] = await busCall(app, 'facts.search', { limit: 99 });
    expect(reply.ok).toBe(false);
    expect(reply.error).toContain('query');
  });

  it('неизвестное действие — ошибка в ответе', async () => {
    const [[, reply]] = await busCall(app, 'drop', {});
    expect(reply).toMatchObject({ ok: false, error: 'нет действия drop' });
  });

  it('просроченный запрос и чужой replyTo не обрабатываются', async () => {
    expect(await busCall(app, 'infer', {}, { deadline: 1 })).toEqual([]);
    expect(await busCall(app, 'infer', {}, { replyTo: 'cais.events' })).toEqual(
      [],
    );
  });
});
