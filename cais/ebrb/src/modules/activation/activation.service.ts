import { Injectable } from '@nestjs/common';
import { AttributeData } from '../attributes/types/attributes.types';
import { Match } from '../infer/types/infer.types';
import { RuleData } from '../rules/types/rules.types';

@Injectable()
export class ActivationService {
  activate(
    rules: RuleData[],
    matches: Match[],
    attributes: Map<string, AttributeData>,
  ) {
    const weights = [...attributes.values()].map((a) => a.weight);
    const maxWeight = Math.max(0, ...weights) || 1;
    const degrees = rules.map((rule, k) => {
      const entries = Object.entries(matches[k].similarity);
      if (!entries.length) return 0;
      const product = entries.reduce((value, [name, s]) => {
        const delta = (attributes.get(name)?.weight ?? 1) / maxWeight;
        return value * s ** delta;
      }, 1);
      return rule.weight * product;
    });
    const total = degrees.reduce((sum, degree) => sum + degree, 0);
    return rules.map((rule, k) =>
      total ? (rule.reliability * degrees[k]) / total : 0,
    );
  }
}
