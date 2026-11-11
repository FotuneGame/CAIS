import { Injectable } from '@nestjs/common';
import { InjectionService } from '../../shared/injection/injection.service';
import { LlmService } from '../../shared/llm/llm.service';
import { AttributeData } from '../attributes/types/attributes.types';
import { FactsService } from '../facts/facts.service';
import { PromptsService } from '../prompts/prompts.service';
import { Raw } from '../validation/types/validation.types';

@Injectable()
export class ExtractionService {
  constructor(
    private readonly llmService: LlmService,
    private readonly promptsService: PromptsService,
    private readonly factsService: FactsService,
    private readonly injectionService: InjectionService,
  ) {}

  async extract(input: string, attributes: AttributeData[]): Promise<Raw> {
    if (!attributes.length) return {};
    const list = attributes
      .map(
        (a) =>
          `- ${a.name}: ${a.description}, диапазон ${a.referential[0]}..${a.referential.at(-1)}`,
      )
      .join('\n');
    const { hits } = await this.factsService
      .search(input.slice(0, 500), 3, true)
      .catch(() => ({ hits: [] }));
    const facts = hits.map((hit) => hit.text).join('\n\n');
    const data = (text: string) => this.injectionService.asData(text);
    const content = facts
      ? `Ситуация:\n${data(input)}\n\nПроверенные факты:\n${data(facts)}`
      : `Ситуация:\n${data(input)}`;
    const answer = await this.llmService.chat([
      {
        role: 'system',
        content: this.promptsService.text('extract', { attributes: list }),
      },
      { role: 'user', content },
    ]);
    return (answer.attributes ?? {}) as Raw;
  }
}
