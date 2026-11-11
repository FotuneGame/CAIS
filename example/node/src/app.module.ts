import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerInterceptor } from './common/interceptors/log.interceptor';
import appConfig from './config/app.config';
import clickhouseConfig from './config/clickhouse.config';
import databaseConfig, { typeOrmFactory } from './config/database.config';
import kafkaConfig from './config/kafka.config';
import keycloakConfig from './config/keycloak.config';
import loggerConfig from './config/logger.config';
import servicesConfig from './config/services.config';
import swaggerConfig from './config/swagger.config';
import { CoreModule } from './modules/core.module';
import { ClickHouseModule } from './shared/clickhouse/clickhouse.module';
import { ElasticModule } from './shared/elastic/elastic.module';
import { HealthModule } from './shared/health/health.module';
import { KafkaModule } from './shared/kafka/kafka.module';
import { KeycloakModule } from './shared/keycloak/keycloak.module';
import { LlmModule } from './shared/llm/llm.module';
import { WinstonModule } from './shared/logger/winston.module';
import { MetricsModule } from './shared/metrics/metrics.module';
import { RedisModule } from './shared/redis/redis.module';
import { S3Module } from './shared/s3/s3.module';

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
        clickhouseConfig,
        servicesConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmFactory }),
    WinstonModule,
    KeycloakModule,
    RedisModule,
    ClickHouseModule,
    ElasticModule,
    KafkaModule,
    S3Module,
    LlmModule,
    MetricsModule,
    HealthModule,
    CoreModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
  ],
})
export class AppModule {}
