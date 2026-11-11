import { Injectable } from '@nestjs/common';
import { AttributeData } from '../attributes/types/attributes.types';
import { Extracted, Match } from '../infer/types/infer.types';
import { RuleData } from '../rules/types/rules.types';
import { DEFAULT_REFERENTIAL } from './constants/similarity.constants';

@Injectable()
export class SimilarityService {
  distribution(value: number, referential: number[]) {
    const h = referential;
    const alpha = h.map(() => 0);
    if (value <= h[0]) alpha[0] = 1;
    else if (value >= h[h.length - 1]) alpha[h.length - 1] = 1;
    else {
      const j = h.findIndex((point, i) => value >= point && value <= h[i + 1]);
      alpha[j] = (h[j + 1] - value) / (h[j + 1] - h[j]);
      alpha[j + 1] = 1 - alpha[j];
    }
    return alpha;
  }

  similarity(input: number[], rule: number[]) {
    const distance = input.reduce((sum, a, j) => sum + (a - rule[j]) ** 2, 0);
    return Math.max(0, 1 - Math.sqrt(distance / 2));
  }

  match(
    rule: RuleData,
    input: Extracted,
    attributes: Map<string, AttributeData>,
  ): Match {
    const similarity: Record<string, number> = {};
    let confidence = 0;
    const names = Object.keys(rule.antecedents);
    for (const name of names) {
      const extracted = input[name];
      if (!extracted) continue;
      const referential =
        attributes.get(name)?.referential ?? DEFAULT_REFERENTIAL;
      const s = this.similarity(
        this.distribution(extracted.value, referential),
        this.distribution(rule.antecedents[name], referential),
      );
      similarity[name] = extracted.confidence * s;
      confidence += extracted.confidence;
    }
    return {
      similarity,
      completeness: names.length ? confidence / names.length : 0,
    };
  }
}
