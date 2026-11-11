import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { GateService } from '../gate/gate.service';
import { OntologyService } from '../ontology/ontology.service';
import { PlannerService } from '../planner/planner.service';
import { Action, ActContext } from '../agent/types/agent.types';

@Injectable()
export class ActService {
  private readonly maxSteps: number;

  constructor(
    private readonly plannerService: PlannerService,
    private readonly gateService: GateService,
    private readonly ontologyService: OntologyService,
    private readonly kafkaService: KafkaService,
    configService: ConfigService,
  ) {
    this.maxSteps = configService.get<number>('agent.maxSteps', 12);
  }

  async act(context: ActContext): Promise<string | null> {
    const { run, messages } = context;
    let last = '';
    let repeats = 0;
    for (let i = 0; i < this.maxSteps; i++) {
      const action = await this.plannerService.next(messages);
      const violations = this.ontologyService.validate(action, context);
      if (violations.length) {
        this.kafkaService.publish({ type: 'violation', run, violations });
        this.plannerService.notice(messages, 'rules', {
          violations: violations.join('; '),
        });
        continue;
      }
      if (action.answer !== undefined) return String(action.answer);
      const key = JSON.stringify([action.tool, action.args]);
      repeats = key === last ? repeats + 1 : 1;
      last = key;
      if (repeats > 2) {
        this.kafkaService.publish({
          type: 'violation',
          run,
          violations: ['повтор действия'],
        });
        this.plannerService.notice(messages, 'repeat', { count: repeats - 1 });
        continue;
      }
      this.plannerService.observe(
        messages,
        await this.execute(context, action),
      );
    }
    return null;
  }

  private async execute(context: ActContext, action: Action) {
    const started = Date.now();
    const name = action.tool!;
    const tool = context.tools[name];
    const { decision, reason } = await this.gateService.check(action, tool);
    const output =
      decision === 'ALLOW'
        ? await tool
            .run(action.args ?? {})
            .catch((e: Error) => `ошибка: ${e.message}`)
        : `действие не допущено (${decision}): ${reason ?? 'правила EBRB'}`;
    context.steps.push({ tool: name, args: action.args, decision, output });
    const durationMs = Date.now() - started;
    this.kafkaService.publish({
      type: 'step',
      run: context.run,
      tool: name,
      decision,
      durationMs,
    });
    return output;
  }
}
