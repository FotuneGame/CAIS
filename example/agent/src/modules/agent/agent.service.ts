import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectionService } from '../../shared/injection/injection.service';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { LlmService } from '../../shared/llm/llm.service';
import { Message } from '../../shared/llm/types/llm.types';
import { MemoryService } from '../memory/memory.service';
import { PromptsService } from '../prompts/prompts.service';
import { ToolsService } from '../tools/tools.service';
import { OntologyService } from '../ontology/ontology.service';
import { Action, Step } from './types/agent.types';

@Injectable()
export class AgentService {
  constructor(
    private readonly llmService: LlmService,
    private readonly memoryService: MemoryService,
    private readonly promptsService: PromptsService,
    private readonly toolsService: ToolsService,
    private readonly ontologyService: OntologyService,
    private readonly injectionService: InjectionService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  async run(task: string, owner: string) {
    const findings = this.injectionService.findings(task);
    if (findings.length)
      this.kafkaService.publish({ type: 'injection', owner, findings });
    const messages = await this.start(task);
    const steps: Step[] = [];
    const maxSteps = this.configService.get<number>('agent.maxSteps', 5);
    for (let i = 0; i < maxSteps; i++) {
      const action = (await this.llmService.chat(messages)) as Action;
      const violations = this.ontologyService.validate(action);
      this.kafkaService.publish({
        type: 'step',
        owner,
        tool: action?.tool,
        violations,
      });
      if (violations.length) {
        const content = this.promptsService.text('format', {
          violations: violations.join('; '),
        });
        messages.push({ role: 'user', content });
        continue;
      }
      if (action.answer !== undefined) {
        await this.memoryService.remember(task, action.answer);
        return { answer: action.answer, steps };
      }
      const observation = this.toolsService.run(
        action.tool!,
        action.input ?? '',
      );
      steps.push({ ...action, observation });
      messages.push(
        { role: 'assistant', content: JSON.stringify(action) },
        {
          role: 'user',
          content: `Результат:\n${this.injectionService.asData(observation)}`,
        },
      );
    }
    return { answer: null, steps, error: 'достигнут предел шагов' };
  }

  private async start(task: string): Promise<Message[]> {
    const memories = await this.memoryService.recall(task);
    const context = memories.length
      ? `\n\nИз памяти:\n${this.injectionService.asData(memories.join('\n'))}`
      : '';
    const system = this.promptsService.text('system', {
      tools: this.toolsService.describe(),
    });
    return [
      { role: 'system', content: system },
      { role: 'user', content: task + context },
    ];
  }
}
