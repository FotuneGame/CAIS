import { Injectable } from '@nestjs/common';
import { InjectionService } from '../../shared/injection/injection.service';
import { LlmService } from '../../shared/llm/llm.service';
import { Message } from '../../shared/llm/types/llm.types';
import { PromptName } from '../prompts/constants/prompts.constants';
import { PromptsService } from '../prompts/prompts.service';
import { GoalsService } from '../goals/goals.service';
import { Action, Goal, Tools } from '../agent/types/agent.types';

@Injectable()
export class PlannerService {
  constructor(
    private readonly llmService: LlmService,
    private readonly promptsService: PromptsService,
    private readonly goalsService: GoalsService,
    private readonly injectionService: InjectionService,
  ) {}

  start(goal: Goal, memories: string[], tools: Tools): Message[] {
    const list = Object.entries(tools)
      .map(([name, t]) => `- ${name}(${t.args.join(', ')}): ${t.description}`)
      .join('\n');
    const context = memories.length
      ? `\n\nОпыт прошлых задач:\n${this.injectionService.asData(memories.join('\n'))}`
      : '';
    return [
      {
        role: 'system',
        content: this.promptsService.text('plan', { tools: list }),
      },
      { role: 'user', content: this.goalsService.describe(goal) + context },
    ];
  }

  async next(messages: Message[]) {
    const action = (await this.llmService.chat(messages)) as Action;
    messages.push({ role: 'assistant', content: JSON.stringify(action) });
    return action;
  }

  observe(messages: Message[], output: string) {
    const content = `Результат:\n${this.injectionService.asData(output)}`;
    messages.push({ role: 'user', content });
  }

  notice(
    messages: Message[],
    name: PromptName,
    vars: Record<string, string | number>,
  ) {
    messages.push({
      role: 'user',
      content: this.promptsService.text(name, vars),
    });
  }
}
