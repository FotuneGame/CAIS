import { Injectable } from '@nestjs/common';
import { InjectionService } from '../../shared/injection/injection.service';
import { LlmService } from '../../shared/llm/llm.service';
import { PromptsService } from '../prompts/prompts.service';
import { Trace } from './types/explain.types';

@Injectable()
export class ExplainService {
  constructor(
    private readonly llmService: LlmService,
    private readonly promptsService: PromptsService,
    private readonly injectionService: InjectionService,
  ) {}

  async explain(trace: Trace) {
    const fallback = this.template(trace);
    try {
      const answer = await this.llmService.chat([
        { role: 'system', content: this.promptsService.text('explain') },
        {
          role: 'user',
          content: this.injectionService.asData(JSON.stringify(trace)),
        },
      ]);
      return typeof answer.explanation === 'string'
        ? answer.explanation
        : fallback;
    } catch {
      return fallback;
    }
  }

  template({ action, hypothesis, belief, ignorance, conflict, rules }: Trace) {
    const f = (value: number) => value.toFixed(2);
    const top = rules.map((r) => `${r.id} (ω = ${f(r.activation)})`).join(', ');
    return `Действие ${action}: гипотеза ${hypothesis} с β = ${f(belief[hypothesis ?? ''] ?? 0)}, незнание βΘ = ${f(ignorance)}, конфликт C = ${f(conflict)}; правила: ${top || 'нет'}.`;
  }
}
