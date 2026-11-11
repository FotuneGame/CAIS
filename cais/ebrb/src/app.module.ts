import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from './common/guards/auth.guard';
import { LoggerInterceptor } from './common/interceptors/log.interceptor';
import appConfig from './config/app.config';
import databaseConfig, { typeOrmFactory } from './config/database.config';
import ebrbConfig from './config/ebrb.config';
import elasticsearchConfig from './config/elasticsearch.config';
import kafkaConfig from './config/kafka.config';
import keycloakConfig from './config/keycloak.config';
import llmConfig from './config/llm.config';
import loggerConfig from './config/logger.config';
import swaggerConfig from './config/swagger.config';
import { CoreModule } from './modules/core.module';
import { BusServerModule } from './shared/bus-server/bus-server.module';
import { ElasticModule } from './shared/elastic/elastic.module';
import { HealthModule } from './shared/health/health.module';
import { InjectionModule } from './shared/injection/injection.module';
import { KafkaModule } from './shared/kafka/kafka.module';
import { KeycloakModule } from './shared/keycloak/keycloak.module';
import { LlmModule } from './shared/llm/llm.module';
import { WinstonModule } from './shared/logger/winston.module';
import { MetricsModule } from './shared/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        appConfig,
        loggerConfig,
        swaggerConfig,
        keycloakConfig,
        kafkaConfig,
        databaseConfig,
        llmConfig,
        elasticsearchConfig,
        ebrbConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmFactory }),
    WinstonModule,
    KeycloakModule,
    KafkaModule,
    BusServerModule,
    LlmModule,
    ElasticModule,
    InjectionModule,
    HealthModule,
    MetricsModule,
    CoreModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
