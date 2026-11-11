import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '../src/common/guards/auth.guard';
import appConfig from '../src/config/app.config';
import loggerConfig from '../src/config/logger.config';
import keycloakConfig from '../src/config/keycloak.config';
import kafkaConfig from '../src/config/kafka.config';
import clickhouseConfig from '../src/config/clickhouse.config';
import traceConfig from '../src/config/trace.config';
import { CoreModule } from '../src/modules/core.module';
import { WinstonModule } from '../src/shared/logger/winston.module';
import { KeycloakModule } from '../src/shared/keycloak/keycloak.module';
import { BusServerModule } from '../src/shared/bus-server/bus-server.module';
import { KafkaModule } from '../src/shared/kafka/kafka.module';
import { ClickHouseModule } from '../src/shared/clickhouse/clickhouse.module';

export function testModule() {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [
          appConfig,
          loggerConfig,
          keycloakConfig,
          kafkaConfig,
          clickhouseConfig,
          traceConfig,
        ],
      }),
      WinstonModule,
      KeycloakModule,
      KafkaModule,
      BusServerModule,
      ClickHouseModule,
      CoreModule,
    ],
    providers: [
      {
        provide: APP_PIPE,
        useValue: new ValidationPipe({ whitelist: true, transform: true }),
      },
      { provide: APP_GUARD, useClass: AuthGuard },
    ],
  });
}
