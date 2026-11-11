import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Action } from '../src/modules/actions/entity/action.entity';
import { Attribute } from '../src/modules/attributes/entity/attribute.entity';
import { Prompt } from '../src/modules/prompts/entity/prompt.entity';
import { Rule } from '../src/modules/rules/entity/rule.entity';
import { StoreService } from '../src/modules/store/store.service';
import { LlmService } from '../src/shared/llm/llm.service';
import { testModule } from './module';
import { FakeRepository } from './fake.repository';
import { base, FakeStore } from './fake.store';

export async function createApp(chat: jest.Mock) {
  process.env.AUTH_DISABLED = 'true';
  const moduleRef = await testModule()
    .overrideProvider(getRepositoryToken(Attribute))
    .useValue(new FakeRepository<Attribute>(['name']))
    .overrideProvider(getRepositoryToken(Action))
    .useValue(new FakeRepository<Action>(['name']))
    .overrideProvider(getRepositoryToken(Rule))
    .useValue(new FakeRepository<Rule>())
    .overrideProvider(getRepositoryToken(Prompt))
    .useValue(new FakeRepository<Prompt>(['agent', 'name']))
    .overrideProvider(StoreService)
    .useValue(new FakeStore())
    .overrideProvider(LlmService)
    .useValue({ chat })
    .compile();
  const app: INestApplication = moduleRef.createNestApplication();
  await app.init();
  await request(app.getHttpServer()).post('/base').send(base).expect(201);
  return app;
}
