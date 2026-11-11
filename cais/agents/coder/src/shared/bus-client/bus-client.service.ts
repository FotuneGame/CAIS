import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { REQUESTS } from '../kafka/constants/kafka.constants';
import { KafkaService } from '../kafka/kafka.service';
import { BusReply, BusRequest } from '../kafka/types/kafka.types';
import { KeycloakService } from '../keycloak/keycloak.service';
import { WinstonService } from '../logger/winston.service';
import { REPLIES } from './constants/bus-client.constants';
import { Pending } from './types/bus-client.types';

@Injectable()
export class BusClientService implements OnApplicationBootstrap {
  private readonly pending = new Map<string, Pending>();
  private readonly replyTo: string;
  private readonly group: string;
  private readonly timeoutMs: number;
  private ready?: Promise<void>;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly keycloakService: KeycloakService,
    private readonly logger: WinstonService,
    configService: ConfigService,
  ) {
    const name = configService.get<string>('app.name', 'app');
    this.replyTo = REPLIES(name);
    this.group = `${name}-replies-${randomUUID()}`;
    this.timeoutMs = configService.get<number>('kafka.timeoutMs', 180000);
  }

  get enabled() {
    return this.kafkaService.enabled;
  }

  onApplicationBootstrap() {
    if (!this.enabled) return;
    this.listen().catch((error: Error) =>
      this.logger.warn(`ответы: ${error.message}`, 'Bus'),
    );
  }

  async request<T>(service: string, action: string, body: unknown) {
    await this.listen();
    const id = randomUUID();
    const token = await this.keycloakService.serviceToken();
    const reply = new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new Error(`${service} не ответил за ${this.timeoutMs / 1000} с`),
        );
      }, this.timeoutMs);
      this.pending.set(id, {
        resolve: resolve as Pending['resolve'],
        reject,
        timer,
      });
    });
    const message: BusRequest = {
      id,
      replyTo: this.replyTo,
      action,
      deadline: Date.now() + this.timeoutMs,
      token,
      body,
    };
    await this.kafkaService.send(REQUESTS(service), message).catch((error) => {
      this.settle({ id, ok: false, error: (error as Error).message });
    });
    return reply;
  }

  private listen() {
    this.ready ??= this.kafkaService
      .subscribe(this.replyTo, this.group, (value) => this.receive(value))
      .catch((error: Error) => {
        this.ready = undefined;
        throw error;
      });
    return this.ready;
  }

  private receive(value: string) {
    try {
      this.settle(JSON.parse(value) as BusReply);
    } catch {
      return;
    }
  }

  private settle({ id, ok, data, error }: BusReply) {
    const pending = this.pending.get(id);
    if (!pending) return;
    this.pending.delete(id);
    clearTimeout(pending.timer);
    if (ok) pending.resolve(data);
    else pending.reject(new Error(error ?? 'ошибка сервиса'));
  }
}
