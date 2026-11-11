import { registerAs } from '@nestjs/config';

export interface KafkaConfig {
  brokers: string[];
  topic: string;
}

export default registerAs('kafka', (): KafkaConfig => ({
  brokers: (process.env.KAFKA_BROKERS || '').split(',').filter(Boolean),
  topic: process.env.KAFKA_TOPIC || 'cais.events',
}));
