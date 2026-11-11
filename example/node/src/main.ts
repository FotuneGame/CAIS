import './config/tracing.config';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerOptions } from './config/swagger.config';
import { WinstonService } from './shared/logger/winston.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(WinstonService);
  app.useLogger(logger);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const name = configService.get<string>('app.name', 'node-example');
  const port = configService.get<number>('app.port', 3000);
  const { config, customOptions } = swaggerOptions(name);
  const document = SwaggerModule.createDocument(app, config);
  const path = configService.get<string>('swagger.path', 'docs');
  SwaggerModule.setup(path, app, document, customOptions);

  await app.listen(port);
  logger.log(`${name} слушает порт ${port}`, 'Bootstrap');
}

void bootstrap();
