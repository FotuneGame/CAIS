import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './app';

describe('EBRB API', () => {
  const chat = jest.fn();
  let app: INestApplication;
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    app = await createApp(chat);
  });

  afterAll(() => app.close());

  it('шаги 1–6: извлечение, план, вывод и объяснение — APPROVE', async () => {
    chat
      .mockResolvedValueOnce({
        attributes: { risk: { value: 0, confidence: 0.95 } },
      })
      .mockResolvedValueOnce({ action: 'read' })
      .mockResolvedValueOnce({ explanation: 'чтение безопасно' });
    const { body } = await request(server())
      .post('/infer')
      .send({ input: 'прочитать файл' })
      .expect(200);
    expect(body).toMatchObject({
      decision: 'APPROVE',
      hypothesis: 'ALLOW',
      action: 'read',
    });
    expect(body.explanation).toBe('чтение безопасно');
  });

  it('атрибут вне схемы или диапазона — REFINE', async () => {
    const attributes = { risk: { value: 5 } };
    const { body } = await request(server())
      .post('/infer')
      .send({ attributes, action: 'read' })
      .expect(200);
    expect(body.decision).toBe('REFINE');
    expect(body.problems[0]).toContain('вне диапазона');
  });

  it('низкая уверенность — REFINE, небезопасное действие — ESCALATE', async () => {
    const low = { risk: { value: 0, confidence: 0.2 } };
    const refine = await request(server())
      .post('/infer')
      .send({ attributes: low, action: 'read' });
    expect(refine.body.decision).toBe('REFINE');
    const sure = { risk: { value: 0, confidence: 1 } };
    const escalate = await request(server())
      .post('/infer')
      .send({ attributes: sure, action: 'shell' });
    expect(escalate.body.decision).toBe('ESCALATE');
  });

  it('база: повтор референтных значений и Σβ > 1 отклоняются', async () => {
    await request(server())
      .post('/attributes')
      .send({ name: 'flat', description: 'x', referential: [0, 0, 1] })
      .expect(400);
    await request(server())
      .post('/rules')
      .send({ id: 'bad', antecedents: {}, consequent: { A: 0.7, B: 0.5 } })
      .expect(400);
  });

  it('факты и обученные правила не оценены экспертом до проверки', async () => {
    const fact = await request(server())
      .post('/facts')
      .send({ title: 'a.md', text: 'кеш' })
      .expect(201);
    expect(fact.body.reviewed).toBe(false);
    await request(server())
      .post('/facts/review')
      .send({ title: 'a.md' })
      .expect(200);
    const samples = [{ attributes: { risk: 0.5 }, label: 'ESCALATE' }];
    const learned = await request(server())
      .post('/learn')
      .send({ samples })
      .expect(201);
    expect(learned.body.reviewed).toBe(false);
    await request(server())
      .post('/rules/review')
      .send({ id: learned.body.added[0] })
      .expect(200);
  });
});
