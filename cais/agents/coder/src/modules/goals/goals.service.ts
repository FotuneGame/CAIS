import { Injectable } from '@nestjs/common';
import { LlmService } from '../../shared/llm/llm.service';
import { PromptsService } from '../prompts/prompts.service';
import { Goal } from '../agent/types/agent.types';

@Injectable()
export class GoalsService {
  constructor(
    private readonly llmService: LlmService,
    private readonly promptsService: PromptsService,
  ) {}

  async create(task: string): Promise<Goal> {
    const { goal, criteria } = await this.llmService.chat([
      { role: 'system', content: this.promptsService.text('goal') },
      { role: 'user', content: task },
    ]);
    return {
      task,
      goal: typeof goal === 'string' && goal ? goal : task,
      criteria:
        Array.isArray(criteria) && criteria.length
          ? criteria.map(String)
          : ['задача выполнена'],
    };
  }

  describe(goal: Goal) {
    return [
      `Задача: ${goal.task}`,
      `Цель: ${goal.goal}`,
      `Критерии готовности:\n- ${goal.criteria.join('\n- ')}`,
    ].join('\n\n');
  }
}
