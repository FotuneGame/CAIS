import { rm } from 'node:fs/promises';
import request from 'supertest';
import { createApp } from './app';
import { busCall } from './bus';

const answers = [
  { goal: 'создать файл', criteria: ['файл есть'] },
  { thought: 'пишу', tool: 'write', args: { path: 'a.txt', content: 'ok' } },
  { thought: 'готово', answer: 'создан a.txt' },
  { passed: true, note: 'файл создан' },
];

describe('runs', () => {
  const chat = jest.fn(() => Promise.resolve(answers.shift()));
  let ctx: Awaited<ReturnType<typeof createApp>>;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    ctx = await createApp(chat);
  });

  afterAll(async () => {
    await ctx.app.close();
    await rm(`${process.cwd()}/app-data-test`, {
      recursive: true,
      force: true,
    });
  });

  it('runs.status по шине: чужой владелец не видит задачу', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    const [[, missing]] = await busCall(ctx.app, 'runs.status', {
      id,
      owner: 'alice',
    });
    expect(missing).toMatchObject({ ok: false, error: 'задача не найдена' });
    const [[, invalid]] = await busCall(ctx.app, 'runs.start', { task: '' });
    expect(invalid.ok).toBe(false);
  });

  it('выполняет задачу и отдаёт статус владельцу', async () => {
    const started = await request(server())
      .post('/runs')
      .send({ task: 'создай a.txt', wait: 5 })
      .expect(201);
    expect(started.body.status).toBe('done');
    expect(started.body.result.passed).toBe(true);
    const kinds = ctx.repositories.memories.rows.map((row) => row.kind);
    expect(kinds).toEqual(['lesson', 'task']);
    const status = await request(server())
      .post('/runs/status')
      .send({ id: started.body.id })
      .expect(200);
    expect(status.body.result.answer).toBe('создан a.txt');
    await request(server())
      .post('/runs/status')
      .send({ id: started.body.id, owner: 'other' })
      .expect(404);
  });

  it('отклоняет пустую задачу', () =>
    request(server()).post('/runs').send({ task: '' }).expect(400));

  it('промпты хранятся в репозитории', async () => {
    expect(ctx.repositories.prompts.rows.map((row) => row.name)).toContain(
      'plan',
    );
    const res = await request(server())
      .put('/prompts')
      .send({ name: 'rules', text: 'Нарушено: {violations}' })
      .expect(200);
    expect(res.body.rules).toBe('Нарушено: {violations}');
  });
});
