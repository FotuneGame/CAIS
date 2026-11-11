import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, logLevel, Producer } from 'kafkajs';
import { KafkaConfig } from '../../config/kafka.config';
import { WinstonService } from '../logger/winston.service';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private readonly config: KafkaConfig;
  private readonly name: string;
  private readonly kafka?: Kafka;
  private producer?: Promise<Producer>;

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

  publish(event: Record<string, unknown>) {
    const record = {
      time: new Date().toISOString(),
      agent: this.name,
      ...event,
    };
    this.logger.log(String(event.type), 'Kafka', record);
    if (!this.kafka) return;
    this.producer ??= this.connect(this.kafka);
    this.producer
      .then((producer) =>
        producer.send({
          topic: this.config.topic,
          messages: [{ value: JSON.stringify(record) }],
        }),
      )
      .catch((error: Error) => {
        this.producer = undefined;
        this.logger.error(`отправка: ${error.message}`, error.stack, 'Kafka');
      });
  }

  async onModuleDestroy() {
    await (await this.producer?.catch(() => undefined))?.disconnect();
  }

  private async connect(kafka: Kafka) {
    const producer = kafka.producer({ allowAutoTopicCreation: true });
    await producer.connect();
    return producer;
  }
}
