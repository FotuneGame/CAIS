import { registerAs } from '@nestjs/config';

export interface LoggerConfig {
  level: string;
  path: string;
  maxSize: string;
  maxDays: string;
}

export default registerAs('logger', (): LoggerConfig => ({
  level: process.env.LOG_LEVEL || 'info',
  path: process.env.LOG_PATH || '',
  maxSize: process.env.LOG_MAX_SIZE || '5m',
  maxDays: process.env.LOG_MAX_DAYS || '14d',
}));
