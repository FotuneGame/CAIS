import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Job } from '../src/modules/jobs/entity/job.entity';
import { LlamaService } from '../src/modules/llama/llama.service';
import { Model } from '../src/modules/models/entity/model.entity';
import { FakeRepository } from './fake.repository';
import { testModule } from './module';

export const llama = {
  finetune: jest.fn((options: { model: string; output: string }) => {
    copyFileSync(options.model, options.output);
    return Promise.resolve('');
  }),
  quantize: jest.fn((input: string, output: string) => {
    copyFileSync(input, output);
    return Promise.resolve('');
  }),
  perplexity: jest.fn(() => Promise.resolve(12.5)),
};

export function workspace(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'train-'));
  mkdirSync(join(root, 'dataset'));
  mkdirSync(join(root, 'models'));
  writeFileSync(join(root, 'models', 'base.gguf'), 'GGUF');
  for (const [name, text] of Object.entries(files)) {
    writeFileSync(join(root, 'dataset', name), text);
  }
  process.env.APP_DATA_PATH = root;
  return root;
}

export async function createApp() {
  process.env.AUTH_DISABLED = 'true';
  const repositories = {
    jobs: new FakeRepository<Job>(),
    models: new FakeRepository<Model>(['name']),
  };
  const moduleRef = await testModule()
    .overrideProvider(getRepositoryToken(Job))
    .useValue(repositories.jobs)
    .overrideProvider(getRepositoryToken(Model))
    .useValue(repositories.models)
    .overrideProvider(LlamaService)
    .useValue(llama)
    .compile();
  const app: INestApplication = moduleRef.createNestApplication();
  await app.init();
  return { app, repositories };
}

export async function waitDone(
  status: () => Promise<{ body: { status: string } }>,
) {
  for (let i = 0; i < 50 && (await status()).body.status === 'running'; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return (await status()).body.status;
}
