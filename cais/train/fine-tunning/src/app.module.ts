import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from './common/guards/auth.guard';
import { LoggerInterceptor } from './common/interceptors/log.interceptor';
import appConfig from './config/app.config';
import databaseConfig, { typeOrmFactory } from './config/database.config';
import kafkaConfig from './config/kafka.config';
import keycloakConfig from './config/keycloak.config';
import llamaConfig from './config/llama.config';
import loggerConfig from './config/logger.config';
import swaggerConfig from './config/swagger.config';
import { CoreModule } from './modules/core.module';
import { HealthModule } from './shared/health/health.module';
import { KafkaModule } from './shared/kafka/kafka.module';
import { KeycloakModule } from './shared/keycloak/keycloak.module';
import { WinstonModule } from './shared/logger/winston.module';
import { MetricsModule } from './shared/metrics/metrics.module';
import { StorageModule } from './shared/storage/storage.module';

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
        llamaConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmFactory }),
    WinstonModule,
    KeycloakModule,
    KafkaModule,
    StorageModule,
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
