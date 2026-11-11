import { Injectable } from '@nestjs/common';
import { InjectionService } from '../../shared/injection/injection.service';
import { LlmService } from '../../shared/llm/llm.service';
import { PromptsService } from '../prompts/prompts.service';
import { GoalsService } from '../goals/goals.service';
import { Goal, Review, Step } from '../agent/types/agent.types';

@Injectable()
export class ReflectionService {
  constructor(
    private readonly llmService: LlmService,
    private readonly promptsService: PromptsService,
    private readonly goalsService: GoalsService,
    private readonly injectionService: InjectionService,
  ) {}

  async check(goal: Goal, answer: string, steps: Step[]): Promise<Review> {
    const data = (text: string) => this.injectionService.asData(text);
    const trace = steps
      .map(
        (s) =>
          `${s.tool}(${JSON.stringify(s.args)}) -> ${s.output.slice(0, 300)}`,
      )
      .join('\n');
    const report = [
      this.goalsService.describe(goal),
      `Шаги:\n${data(trace || '(нет)')}`,
      `Ответ агента:\n${data(answer)}`,
    ].join('\n\n');
    const { passed, note } = await this.llmService.chat([
      { role: 'system', content: this.promptsService.text('check') },
      { role: 'user', content: report },
    ]);
    return {
      passed: passed === true,
      note: typeof note === 'string' ? note : '',
    };
  }
}
