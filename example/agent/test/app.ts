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
import { InjectionModule } from '../src/shared/injection/injection.module';
import { KafkaModule } from '../src/shared/kafka/kafka.module';
import { KeycloakModule } from '../src/shared/keycloak/keycloak.module';
import { LlmModule } from '../src/shared/llm/llm.module';
import { LlmService } from '../src/shared/llm/llm.service';
import { WinstonModule } from '../src/shared/logger/winston.module';
import { FakeRepository } from './fake.repository';

export async function createApp(chat: jest.Mock) {
  process.env.AUTH_DISABLED = 'true';
  const memories = new FakeRepository<Memory>();
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [
          appConfig,
          loggerConfig,
          keycloakConfig,
          kafkaConfig,
          llmConfig,
          agentConfig,
        ],
      }),
      WinstonModule,
      KeycloakModule,
      KafkaModule,
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
    .useValue(memories)
    .overrideProvider(getRepositoryToken(Prompt))
    .useValue(new FakeRepository<Prompt>(['agent', 'name']))
    .overrideProvider(LlmService)
    .useValue({ chat })
    .compile();
  const app: INestApplication = moduleRef.createNestApplication();
  await app.init();
  return { app, memories };
}
