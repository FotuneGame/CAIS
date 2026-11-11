import request from 'supertest';
import { CalcService } from '../src/modules/calc/calc.service';
import { MemoryService } from '../src/modules/memory/memory.service';
import { createApp } from './app';

describe('agent', () => {
  const chat = jest.fn();
  let ctx: Awaited<ReturnType<typeof createApp>>;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    ctx = await createApp(chat);
  });

  afterAll(() => ctx.app.close());

  it('calc считает только арифметику', () => {
    const calc = ctx.app.get(CalcService);
    expect(calc.calculate('2*(3+4)')).toBe(14);
    expect(() => calc.calculate('process.exit()')).toThrow();
  });

  it('инструмент, затем ответ; результат передаётся как данные', async () => {
    chat
      .mockResolvedValueOnce({ tool: 'calc', input: '2+2' })
      .mockResolvedValueOnce({ answer: '4' });
    const { body } = await request(server())
      .post('/run')
      .send({ task: 'сложи 2+2' })
      .expect(200);
    expect(body.answer).toBe('4');
    expect(chat.mock.calls[1][0].at(-1).content).toContain(
      '<data>\n4\n</data>',
    );
  });

  it('память находит прошлую задачу по словам', async () => {
    const memory = ctx.app.get(MemoryService);
    expect(await memory.recall('снова сложи числа')).toEqual([
      'сложи 2+2 -> 4',
    ]);
    expect(await memory.recall('погода')).toEqual([]);
  });

  it('промпт берётся из репозитория', async () => {
    await request(server())
      .put('/prompts')
      .send({ name: 'system', text: 'Свой промпт {tools}' })
      .expect(200);
    chat.mockResolvedValueOnce({ answer: 'ok' });
    await request(server()).post('/run').send({ task: 'привет' }).expect(200);
    expect(chat.mock.lastCall[0][0].content).toContain('Свой промпт - time');
  });
});
