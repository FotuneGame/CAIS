import { ConfigService } from '@nestjs/config';
import { BusClientService } from '../src/shared/bus-client/bus-client.service';
import { KafkaService } from '../src/shared/kafka/kafka.service';
import { BusRequest, Listener } from '../src/shared/kafka/types/kafka.types';
import { KeycloakService } from '../src/shared/keycloak/keycloak.service';
import { WinstonService } from '../src/shared/logger/winston.service';

function client(answer: (request: BusRequest) => object | null) {
  let listener: Listener = () => undefined;
  const sent: [string, BusRequest][] = [];
  const kafka = {
    enabled: true,
    subscribe: jest.fn((_topic: string, _group: string, l: Listener) => {
      listener = l;
      return Promise.resolve();
    }),
    send: jest.fn((topic: string, request: BusRequest) => {
      sent.push([topic, request]);
      const reply = answer(request);
      if (reply) void listener(JSON.stringify({ id: request.id, ...reply }));
      return Promise.resolve();
    }),
  };
  const config = new ConfigService({
    app: { name: 'mcp' },
    kafka: { timeoutMs: 50 },
  });
  const bus = new BusClientService(
    kafka as unknown as KafkaService,
    { serviceToken: () => Promise.resolve('jwt') } as KeycloakService,
    { warn: jest.fn() } as unknown as WinstonService,
    config,
  );
  return { bus, kafka, sent };
}

describe('клиент шины Kafka', () => {
  it('запрос уходит в cais.<сервис>.requests с токеном, ответ по id', async () => {
    const { bus, kafka, sent } = client(() => ({ ok: true, data: 42 }));
    await expect(bus.request('ebrb', 'infer', { input: 'x' })).resolves.toBe(
      42,
    );
    const [[topic, request]] = sent;
    expect(topic).toBe('cais.ebrb.requests');
    expect(request).toMatchObject({
      replyTo: 'cais.mcp.replies',
      action: 'infer',
      token: 'jwt',
      body: { input: 'x' },
    });
    expect(kafka.subscribe.mock.calls[0][0]).toBe('cais.mcp.replies');
  });

  it('ошибка сервиса передаётся вызывающему', async () => {
    const { bus } = client(() => ({ ok: false, error: 'нет действия x' }));
    await expect(bus.request('ebrb', 'x', {})).rejects.toThrow(
      'нет действия x',
    );
  });

  it('без ответа — ошибка по таймауту', async () => {
    const { bus } = client(() => null);
    await expect(bus.request('trace', 'report', {})).rejects.toThrow(
      'trace не ответил',
    );
  });
});
