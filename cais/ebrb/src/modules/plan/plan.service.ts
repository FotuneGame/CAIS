import { Injectable } from '@nestjs/common';
import { InjectionService } from '../../shared/injection/injection.service';
import { LlmService } from '../../shared/llm/llm.service';
import { ActionsService } from '../actions/actions.service';
import { Extracted } from '../infer/types/infer.types';
import { PromptsService } from '../prompts/prompts.service';

@Injectable()
export class PlanService {
  constructor(
    private readonly llmService: LlmService,
    private readonly promptsService: PromptsService,
    private readonly actionsService: ActionsService,
    private readonly injectionService: InjectionService,
  ) {}

  async plan(input: string | undefined, extracted: Extracted, action?: string) {
    if (action) return action;
    const actions = this.actionsService.current();
    if (!input || !actions.length) return null;
    const list = actions.map((a) => `- ${a.name}: ${a.description}`).join('\n');
    const data = this.injectionService.asData(
      `${input}\n\nАтрибуты: ${JSON.stringify(extracted)}`,
    );
    const answer = await this.llmService.chat([
      {
        role: 'system',
        content: this.promptsService.text('plan', { actions: list }),
      },
      { role: 'user', content: data },
    ]);
    const name = typeof answer.action === 'string' ? answer.action : null;
    return actions.some((a) => a.name === name) ? name : null;
  }
}
