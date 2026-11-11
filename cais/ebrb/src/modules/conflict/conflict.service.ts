import { Injectable } from '@nestjs/common';
import { RuleData } from '../rules/types/rules.types';

@Injectable()
export class ConflictService {
  measure(rules: RuleData[], weights: number[], hypotheses: string[]) {
    let weighted = 0;
    let total = 0;
    for (let k = 0; k < rules.length; k++) {
      for (let l = k + 1; l < rules.length; l++) {
        const w = weights[k] * weights[l];
        if (!w) continue;
        weighted += w * (1 - this.cosine(rules[k], rules[l], hypotheses));
        total += w;
      }
    }
    return total ? weighted / total : 0;
  }

  private cosine(a: RuleData, b: RuleData, hypotheses: string[]) {
    const va = hypotheses.map((h) => a.consequent[h] ?? 0);
    const vb = hypotheses.map((h) => b.consequent[h] ?? 0);
    const dot = va.reduce((s, x, i) => s + x * vb[i], 0);
    const norm = Math.sqrt(
      va.reduce((s, x) => s + x * x, 0) * vb.reduce((s, x) => s + x * x, 0),
    );
    return norm ? dot / norm : 0;
  }
}
