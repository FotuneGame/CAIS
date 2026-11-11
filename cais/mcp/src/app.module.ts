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
import loggerConfig from './config/logger.config';
import servicesConfig from './config/services.config';
import swaggerConfig from './config/swagger.config';
import { CoreModule } from './modules/core.module';
import { BusClientModule } from './shared/bus-client/bus-client.module';
import { HealthModule } from './shared/health/health.module';
import { InjectionModule } from './shared/injection/injection.module';
import { KafkaModule } from './shared/kafka/kafka.module';
import { KeycloakModule } from './shared/keycloak/keycloak.module';
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
        servicesConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmFactory }),
    WinstonModule,
    KeycloakModule,
    KafkaModule,
    BusClientModule,
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
