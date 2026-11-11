import { INestApplication } from '@nestjs/common';
import { BusServerService } from '../src/shared/bus-server/bus-server.service';
import { KafkaService } from '../src/shared/kafka/kafka.service';
import { BusReply, BusRequest } from '../src/shared/kafka/types/kafka.types';

export async function busCall(
  app: INestApplication,
  action: string,
  body: unknown,
  request: Partial<BusRequest> = {},
) {
  const sent: [string, BusReply][] = [];
  const kafka = app.get(KafkaService);
  const spy = jest.spyOn(kafka, 'send').mockImplementation((topic, reply) => {
    sent.push([topic, reply as BusReply]);
    return Promise.resolve();
  });
  const message: BusRequest = {
    id: 'r1',
    replyTo: 'cais.mcp.replies',
    action,
    deadline: Date.now() + 60000,
    body,
    ...request,
  };
  await app.get(BusServerService).serve(JSON.stringify(message));
  spy.mockRestore();
  return sent;
}
