import { Injectable } from '@nestjs/common';
import { ActivationService } from '../activation/activation.service';
import { AttributeData } from '../attributes/types/attributes.types';
import { ConflictService } from '../conflict/conflict.service';
import { Extracted } from '../infer/types/infer.types';
import { ReasoningService } from '../reasoning/reasoning.service';
import { RuleData } from '../rules/types/rules.types';
import { SimilarityService } from '../similarity/similarity.service';

@Injectable()
export class EvidenceService {
  constructor(
    private readonly similarityService: SimilarityService,
    private readonly activationService: ActivationService,
    private readonly reasoningService: ReasoningService,
    private readonly conflictService: ConflictService,
  ) {}

  evaluate(
    rules: RuleData[],
    extracted: Extracted,
    attributes: AttributeData[],
    hypotheses: string[],
  ) {
    const map = new Map(attributes.map((a) => [a.name, a]));
    const matches = rules.map((rule) =>
      this.similarityService.match(rule, extracted, map),
    );
    const weights = this.activationService.activate(rules, matches, map);
    const evidence = rules.map((rule, k) => ({
      consequent: rule.consequent,
      weight: weights[k],
      completeness: matches[k].completeness,
    }));
    const { belief, ignorance } = this.reasoningService.combine(
      evidence,
      hypotheses,
    );
    const conflict = this.conflictService.measure(rules, weights, hypotheses);
    const activated = rules
      .map((rule, k) => ({
        id: rule.id,
        activation: Number(weights[k].toFixed(3)),
        reviewed: rule.reviewed,
      }))
      .filter((rule) => rule.activation > 0.01);
    return { belief, ignorance, conflict, activated };
  }
}
