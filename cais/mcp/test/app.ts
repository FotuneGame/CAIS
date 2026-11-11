import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Audit } from '../src/modules/audit/entity/audit.entity';
import { BusClientService } from '../src/shared/bus-client/bus-client.service';
import { FakeRepository } from './fake.repository';
import { testModule } from './module';

export type ToolResult = { isError?: boolean; content: { text: string }[] };

export const rpc = (method: string, params?: object) => ({
  jsonrpc: '2.0',
  id: 1,
  method,
  params,
});

export async function createApp(authDisabled: boolean) {
  process.env.AUTH_DISABLED = String(authDisabled);
  process.env.AGENTS = 'coder';
  const client = { request: jest.fn(), enabled: true };
  const audit = new FakeRepository<Audit>(['seq']);
  const moduleRef = await testModule()
    .overrideProvider(getRepositoryToken(Audit))
    .useValue(audit)
    .overrideProvider(BusClientService)
    .useValue(client)
    .compile();
  const app: INestApplication = moduleRef.createNestApplication();
  await app.init();
  const post = (body: object) =>
    request(app.getHttpServer())
      .post('/')
      .set('Accept', 'application/json, text/event-stream')
      .send(body);
  const call = async (name: string, args: object = {}) =>
    (await post(rpc('tools/call', { name, arguments: args }))).body
      .result as ToolResult;
  return { app, client, audit, post, call };
}
