import { registerAs } from '@nestjs/config';

export interface KafkaConfig {
  brokers: string[];
  topic: string;
  timeoutMs: number;
}

export default registerAs('kafka', (): KafkaConfig => ({
  brokers: (process.env.KAFKA_BROKERS || '').split(',').filter(Boolean),
  topic: process.env.KAFKA_TOPIC || 'cais.events',
  timeoutMs: parseInt(process.env.BUS_TIMEOUT_MS || '180000', 10),
}));
