import { existsSync } from 'node:fs';
import request from 'supertest';
import { DatasetService } from '../src/modules/dataset/dataset.service';
import { createApp, llama, waitDone, workspace } from './app';

describe('обучение GGUF', () => {
  let root: string;
  let ctx: Awaited<ReturnType<typeof createApp>>;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    root = workspace({ 'corpus.txt': 'Текст для обучения.\n'.repeat(20) });
    ctx = await createApp();
  });

  afterAll(() => ctx.app.close());

  it('чат-датасет переводится в шаблон ChatML', () => {
    const dataset = ctx.app.get(DatasetService);
    const text = dataset.chat(
      { prompt: 'Привет', completion: 'Здравствуйте' },
      0,
    );
    expect(text).toBe(
      '<|im_start|>user\nПривет<|im_end|>\n<|im_start|>assistant\nЗдравствуйте<|im_end|>\n',
    );
  });

  it('POST /jobs: llama-finetune, квантование, перплексия и реестр', async () => {
    const job = {
      base: 'base',
      dataset: 'corpus.txt',
      model: 'base-v2',
      options: { epochs: 1 },
    };
    const { body } = await request(server())
      .post('/jobs')
      .send(job)
      .expect(201);
    const status = () =>
      request(server()).post('/jobs/status').send({ id: body.id });
    expect(await waitDone(status)).toBe('done');
    expect(llama.finetune).toHaveBeenCalled();
    expect(existsSync(`${root}/models/base-v2-Q4_K_M.gguf`)).toBe(true);
    const models = await request(server()).get('/models');
    expect(models.body.models[0]).toMatchObject({
      name: 'base-v2',
      base: 'base',
      metrics: { perplexity: 12.5 },
    });
    const bases = await request(server()).get('/bases');
    expect(bases.body.bases).toContain('base.gguf');
  });

  it('нет базовой модели, неверный путь или формат — 400', async () => {
    await request(server())
      .post('/jobs')
      .send({ base: 'nope', dataset: 'corpus.txt', model: 'x' })
      .expect(400);
    await request(server())
      .post('/jobs')
      .send({ base: 'base', dataset: '../../x', model: 'x' })
      .expect(400);
  });
});
