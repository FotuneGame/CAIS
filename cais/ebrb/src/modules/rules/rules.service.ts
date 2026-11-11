import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rule } from './entity/rule.entity';
import { RuleData, Sample } from './types/rules.types';

@Injectable()
export class RulesService implements OnModuleInit {
  private cache: RuleData[] = [];

  constructor(
    @InjectRepository(Rule) private readonly rules: Repository<Rule>,
  ) {}

  onModuleInit() {
    return this.reload();
  }

  current() {
    return this.cache;
  }

  hypotheses() {
    const names = this.cache.flatMap((rule) => Object.keys(rule.consequent));
    return [...new Set(names)].sort();
  }

  async reload() {
    const rows = await this.rules.find({ order: { id: 'ASC' } });
    this.cache = rows.map((row) => ({
      id: row.id,
      antecedents: row.antecedents,
      consequent: row.consequent,
      weight: row.weight,
      reliability: row.reliability,
      source: row.source,
      reviewed: row.reviewed,
    }));
    return this.cache;
  }

  async save(rules: Omit<RuleData, 'source' | 'reviewed'>[]) {
    for (const { id, consequent } of rules) {
      const beliefs = Object.values(consequent);
      const total = beliefs.reduce((sum, b) => sum + b, 0);
      if (!beliefs.length || beliefs.some((b) => !(b >= 0 && b <= 1)))
        throw new BadRequestException(`${id}: убеждения следствия вне 0..1`);
      if (total > 1 + 1e-9)
        throw new BadRequestException(`${id}: сумма убеждений больше 1`);
    }
    await this.rules.save(
      rules.map((rule) => ({
        ...rule,
        source: 'expert' as const,
        reviewed: true,
      })),
    );
    return this.reload();
  }

  async review(id: string) {
    const { affected } = await this.rules.update({ id }, { reviewed: true });
    if (!affected) throw new NotFoundException(`нет правила ${id}`);
    return this.reload();
  }

  async remove(id: string) {
    const { affected } = await this.rules.delete({ id });
    if (!affected) throw new NotFoundException(`нет правила ${id}`);
    return this.reload();
  }

  async learn(samples: Sample[], prefix = Date.now().toString(36)) {
    const rules: RuleData[] = samples.map(({ attributes, label }, i) => ({
      id: `learned_${prefix}_${i}`,
      antecedents: attributes,
      consequent: { [label]: 1 },
      weight: 1,
      reliability: 1,
      source: 'learned',
      reviewed: false,
    }));
    await this.rules.save(rules);
    await this.reload();
    return { added: rules.map((rule) => rule.id), reviewed: false };
  }
}
