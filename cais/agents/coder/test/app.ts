import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthGuard } from '../src/common/guards/auth.guard';
import agentConfig from '../src/config/agent.config';
import appConfig from '../src/config/app.config';
import kafkaConfig from '../src/config/kafka.config';
import keycloakConfig from '../src/config/keycloak.config';
import llmConfig from '../src/config/llm.config';
import loggerConfig from '../src/config/logger.config';
import { CoreModule } from '../src/modules/core.module';
import { Memory } from '../src/modules/memory/entity/memory.entity';
import { Prompt } from '../src/modules/prompts/entity/prompt.entity';
import { Run } from '../src/modules/runs/entity/run.entity';
import { BusClientModule } from '../src/shared/bus-client/bus-client.module';
import { BusServerModule } from '../src/shared/bus-server/bus-server.module';
import { InjectionModule } from '../src/shared/injection/injection.module';
import { KafkaModule } from '../src/shared/kafka/kafka.module';
import { KeycloakModule } from '../src/shared/keycloak/keycloak.module';
import { LlmModule } from '../src/shared/llm/llm.module';
import { LlmService } from '../src/shared/llm/llm.service';
import { WinstonModule } from '../src/shared/logger/winston.module';
import { FakeRepository } from './fake.repository';

const configs = [
  appConfig,
  loggerConfig,
  keycloakConfig,
  kafkaConfig,
  llmConfig,
  agentConfig,
];

export async function createApp(chat: jest.Mock) {
  process.env.AUTH_DISABLED = 'true';
  process.env.KEYCLOAK_CLIENT_ID = 'cais';
  process.env.APP_DATA_PATH = `${process.cwd()}/app-data-test`;
  const repositories = {
    memories: new FakeRepository<Memory>(),
    runs: new FakeRepository<Run>(),
    prompts: new FakeRepository<Prompt>(['agent', 'name']),
  };
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: configs,
      }),
      WinstonModule,
      KeycloakModule,
      KafkaModule,
      BusClientModule,
      BusServerModule,
      LlmModule,
      InjectionModule,
      CoreModule,
    ],
    providers: [
      {
        provide: APP_PIPE,
        useValue: new ValidationPipe({ whitelist: true, transform: true }),
      },
      { provide: APP_GUARD, useClass: AuthGuard },
    ],
  })
    .overrideProvider(getRepositoryToken(Memory))
    .useValue(repositories.memories)
    .overrideProvider(getRepositoryToken(Run))
    .useValue(repositories.runs)
    .overrideProvider(getRepositoryToken(Prompt))
    .useValue(repositories.prompts)
    .overrideProvider(LlmService)
    .useValue({ chat })
    .compile();
  const app: INestApplication = moduleRef.createNestApplication();
  await app.init();
  return { app, repositories };
}
