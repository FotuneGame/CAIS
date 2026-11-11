import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'node:path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class WinstonService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const level = this.configService.get<string>('logger.level', 'info');
    const dir = this.configService.get<string>('logger.path', '');
    const service = this.configService.get<string>('app.name', 'app');
    const transports: winston.transport[] = [
      new winston.transports.Console({ format: this.consoleFormat() }),
    ];
    if (dir) {
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: path.join(dir, `${service}-%DATE%.log`),
          datePattern: 'YYYY-MM-DD',
          maxSize: this.configService.get<string>('logger.maxSize', '5m'),
          maxFiles: this.configService.get<string>('logger.maxDays', '14d'),
        }),
      );
    }
    this.logger = winston.createLogger({
      level,
      defaultMeta: { service },
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports,
    });
  }

  log(message: unknown, context?: string, data?: object) {
    this.logger.info(String(message), { context, ...data });
  }

  error(message: unknown, trace?: string, context?: string, data?: object) {
    this.logger.error(String(message), { trace, context, ...data });
  }

  warn(message: unknown, context?: string, data?: object) {
    this.logger.warn(String(message), { context, ...data });
  }

  debug(message: unknown, context?: string, data?: object) {
    this.logger.debug(String(message), { context, ...data });
  }

  verbose(message: unknown, context?: string, data?: object) {
    this.logger.verbose(String(message), { context, ...data });
  }

  private consoleFormat() {
    if (!this.configService.get<boolean>('app.dev', false)) {
      return winston.format.json();
    }
    return winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context }) => {
        const ctx = typeof context === 'string' ? context : 'App';
        return `${String(timestamp)} [${ctx}] ${level}: ${String(message)}`;
      }),
    );
  }
}
