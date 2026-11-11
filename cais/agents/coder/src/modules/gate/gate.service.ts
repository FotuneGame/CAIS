import { Injectable } from '@nestjs/common';
import { BusClientService } from '../../shared/bus-client/bus-client.service';
import { Action, Tool, Verdict } from '../agent/types/agent.types';
import { EbrbAnswer } from './types/gate.types';

@Injectable()
export class GateService {
  constructor(private readonly busClientService: BusClientService) {}

  describe(action: Action, tool: Tool) {
    const args = JSON.stringify(action.args ?? {}).slice(0, 4000);
    return `Агент-программист вызывает инструмент ${action.tool} (${tool.description}) в своей песочнице с аргументами ${args}`;
  }

  async check(action: Action, tool: Tool): Promise<Verdict> {
    if (!this.busClientService.enabled)
      return {
        decision: 'ALLOW',
        reason: 'EBRB не подключён: нет KAFKA_BROKERS',
      };
    const body = { input: this.describe(action, tool), action: action.tool };
    return this.busClientService
      .request<EbrbAnswer>('ebrb', 'infer', body)
      .then((answer) => this.verdict(answer))
      .catch((error: Error) => ({
        decision: 'ESCALATE',
        reason: `EBRB недоступен: ${error.message}`,
      }));
  }

  verdict({ decision, hypothesis, reason, explanation }: EbrbAnswer): Verdict {
    if (decision !== 'APPROVE') return { decision, reason };
    if (hypothesis === 'ALLOW')
      return { decision: 'ALLOW', reason: explanation ?? reason };
    return { decision: hypothesis ?? 'BLOCK', reason: explanation ?? reason };
  }
}
