import { registerAs } from '@nestjs/config';

export interface TraceConfig {
  group: string;
  keepDays: number;
}

export default registerAs('trace', (): TraceConfig => ({
  group: process.env.KAFKA_GROUP || 'cais-trace',
  keepDays: parseInt(process.env.KEEP_DAYS || '30', 10),
}));
