import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { REQUESTS } from '../kafka/constants/kafka.constants';
import { KafkaService } from '../kafka/kafka.service';
import { BusReply, BusRequest } from '../kafka/types/kafka.types';
import { KeycloakService } from '../keycloak/keycloak.service';
import { WinstonService } from '../logger/winston.service';
import { REPLY_TOPIC, RETRY_MS } from './constants/bus-server.constants';
import { Route, Run } from './types/bus-server.types';

@Injectable()
export class BusServerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly routes = new Map<string, Route>();
  private readonly name: string;
  private retry?: NodeJS.Timeout;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly keycloakService: KeycloakService,
    private readonly logger: WinstonService,
    configService: ConfigService,
  ) {
    this.name = configService.get<string>('app.name', 'app');
  }

  handle<D extends object>(action: string, dto: Type<D>, run: Run<D>) {
    this.routes.set(action, { dto, run: run as Route['run'] });
  }

  onApplicationBootstrap() {
    if (this.kafkaService.enabled && this.routes.size) this.listen();
  }

  onModuleDestroy() {
    clearTimeout(this.retry);
  }

  async serve(value: string) {
    let request: BusRequest;
    try {
      request = JSON.parse(value) as BusRequest;
    } catch {
      return;
    }
    if (!REPLY_TOPIC.test(String(request?.replyTo))) return;
    if (!(request.deadline > Date.now())) return;
    const reply: BusReply = await this.dispatch(request).then(
      (data) => ({ id: request.id, ok: true, data }),
      (error: Error) => ({ id: request.id, ok: false, error: error.message }),
    );
    await this.kafkaService
      .send(request.replyTo, reply)
      .catch((error: Error) =>
        this.logger.error(error.message, error.stack, 'Bus'),
      );
  }

  private listen() {
    this.kafkaService
      .subscribe(REQUESTS(this.name), `${this.name}-requests`, (value) => {
        void this.serve(value);
      })
      .then(() => this.logger.log(`запросы ${REQUESTS(this.name)}`, 'Bus'))
      .catch((error: Error) => {
        this.logger.warn(`${error.message}, повтор через 10 с`, 'Bus');
        this.retry = setTimeout(() => this.listen(), RETRY_MS);
      });
  }

  private async dispatch({ action, token, body }: BusRequest) {
    const route = this.routes.get(action);
    if (!route) throw new Error(`нет действия ${action}`);
    const user = this.keycloakService.disabled
      ? this.keycloakService.localUser()
      : await this.keycloakService.verify(token ?? '').catch(() => {
          throw new Error('нужен действующий токен Keycloak');
        });
    const dto = plainToInstance(route.dto, body ?? {});
    const errors = await validate(dto, { whitelist: true });
    if (errors.length) throw new Error(this.messages(errors).join('; '));
    return route.run(dto, user);
  }

  private messages(errors: ValidationError[]): string[] {
    return errors.flatMap((e) => [
      ...Object.values(e.constraints ?? {}),
      ...this.messages(e.children ?? []),
    ]);
  }
}
