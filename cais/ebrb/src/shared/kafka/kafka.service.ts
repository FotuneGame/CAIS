import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, logLevel, Producer } from 'kafkajs';
import { KafkaConfig } from '../../config/kafka.config';
import { WinstonService } from '../logger/winston.service';
import { RETENTION_MS } from './constants/kafka.constants';
import { Listener } from './types/kafka.types';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private readonly config: KafkaConfig;
  private readonly name: string;
  private readonly kafka?: Kafka;
  private producer?: Promise<Producer>;
  private readonly consumers: Consumer[] = [];

  constructor(
    configService: ConfigService,
    private readonly logger: WinstonService,
  ) {
    this.config = configService.getOrThrow<KafkaConfig>('kafka');
    this.name = configService.get<string>('app.name', 'app');
    if (this.config.brokers.length) {
      this.kafka = new Kafka({
        clientId: this.name,
        brokers: this.config.brokers,
        logLevel: logLevel.WARN,
      });
    }
  }

  get enabled() {
    return Boolean(this.kafka);
  }

  publish(event: Record<string, unknown>) {
    const record = {
      time: new Date().toISOString(),
      agent: this.name,
      ...event,
    };
    this.logger.log(String(event.type), 'Kafka', record);
    if (!this.kafka) return;
    this.send(this.config.topic, record).catch((error: Error) =>
      this.logger.error(`отправка: ${error.message}`, error.stack, 'Kafka'),
    );
  }

  async send(topic: string, message: object) {
    if (!this.kafka) throw new Error('Kafka не настроена: KAFKA_BROKERS');
    this.producer ??= this.connect(this.kafka);
    try {
      const producer = await this.producer;
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
    } catch (error) {
      this.producer = undefined;
      throw error;
    }
  }

  async subscribe(topic: string, group: string, listener: Listener) {
    if (!this.kafka) throw new Error('Kafka не настроена: KAFKA_BROKERS');
    const admin = this.kafka.admin();
    await admin.connect();
    await admin
      .createTopics({
        topics: [{ topic, configEntries: [RETENTION_MS] }],
        waitForLeaders: true,
      })
      .finally(() => admin.disconnect());
    const consumer = this.kafka.consumer({ groupId: group });
    this.consumers.push(consumer);
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ message }) =>
        listener(message.value?.toString() ?? ''),
    });
  }

  async onModuleDestroy() {
    await Promise.all(
      this.consumers.map((c) => c.disconnect().catch(() => undefined)),
    );
    await (await this.producer?.catch(() => undefined))?.disconnect();
  }

  private async connect(kafka: Kafka) {
    const producer = kafka.producer({ allowAutoTopicCreation: true });
    await producer.connect();
    return producer;
  }
}
