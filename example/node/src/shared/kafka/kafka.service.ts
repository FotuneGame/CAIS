import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, logLevel, Producer } from 'kafkajs';
import { Connection } from '../health/types/health.types';

@Injectable()
export class KafkaService implements Connection, OnModuleDestroy {
  readonly name = 'kafka';
  readonly enabled: boolean;
  private readonly kafka?: Kafka;
  private readonly app: string;
  private producer?: Promise<Producer>;
  private readonly consumers: Consumer[] = [];

  constructor(configService: ConfigService) {
    const brokers = configService.get<string[]>('kafka.brokers', []);
    this.app = configService.get<string>('app.name', 'node-example');
    this.enabled = brokers.length > 0;
    if (this.enabled) {
      this.kafka = new Kafka({
        clientId: this.app,
        brokers,
        logLevel: logLevel.WARN,
      });
    }
  }

  get client(): Kafka {
    if (!this.kafka)
      throw new ServiceUnavailableException(
        'Сервис не настроен: KAFKA_BROKERS',
      );
    return this.kafka;
  }

  async send(topic: string, message: unknown) {
    this.producer ??= this.connectProducer();
    const producer = await this.producer;
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async subscribe<T>(topic: string, handler: (message: T) => Promise<unknown>) {
    await this.admin((admin) =>
      admin.createTopics({ topics: [{ topic }], waitForLeaders: true }),
    );
    const consumer = this.client.consumer({ groupId: `${this.app}-${topic}` });
    this.consumers.push(consumer);
    await consumer.connect();
    await consumer.subscribe({ topic });
    await consumer.run({
      eachMessage: async ({ message }) => {
        await handler(JSON.parse(message.value?.toString() ?? 'null') as T);
      },
    });
  }

  ping() {
    return this.admin((admin) => admin.listTopics());
  }

  async onModuleDestroy() {
    await Promise.all(this.consumers.map((consumer) => consumer.disconnect()));
    await (await this.producer)?.disconnect();
  }

  private async admin<T>(
    work: (admin: ReturnType<Kafka['admin']>) => Promise<T>,
  ) {
    const admin = this.client.admin();
    await admin.connect();
    try {
      return await work(admin);
    } finally {
      await admin.disconnect();
    }
  }

  private async connectProducer() {
    const producer = this.client.producer();
    await producer.connect();
    return producer;
  }
}
