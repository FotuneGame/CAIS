import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { WinstonService } from '../../shared/logger/winston.service';
import { EventsService } from '../events/events.service';
import { Event } from '../events/types/events.types';

@Injectable()
export class ConsumerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private retry?: NodeJS.Timeout;
  private readonly group: string;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly eventsService: EventsService,
    private readonly logger: WinstonService,
    configService: ConfigService,
  ) {
    this.group = configService.get<string>('trace.group', 'cais-trace');
  }

  onApplicationBootstrap() {
    if (this.kafkaService.enabled) void this.start();
  }

  onModuleDestroy() {
    clearTimeout(this.retry);
  }

  private async start() {
    try {
      await this.kafkaService.consume(this.group, (values) =>
        this.eventsService.add(
          values.map((value) => this.parse(value)).filter((e) => e !== null),
        ),
      );
      this.logger.log(`читает группу ${this.group}`, 'Consumer');
    } catch (error) {
      this.logger.warn(
        `${(error as Error).message}, повтор через 10 с`,
        'Consumer',
      );
      this.retry = setTimeout(() => void this.start(), 10000);
    }
  }

  private parse(value: string): Event | null {
    try {
      return this.eventsService.normalize(
        JSON.parse(value) as Record<string, unknown>,
      );
    } catch {
      return null;
    }
  }
}
