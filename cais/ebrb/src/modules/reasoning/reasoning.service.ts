import { Injectable } from '@nestjs/common';
import { Belief, Evidence } from './types/reasoning.types';

@Injectable()
export class ReasoningService {
  combine(evidence: Evidence[], hypotheses: string[]): Belief {
    let prodD = 1;
    let prodBar = 1;
    const prodN = hypotheses.map(() => 1);
    for (const { consequent, weight, completeness } of evidence) {
      const beliefs = hypotheses.map(
        (h) => (consequent[h] ?? 0) * completeness,
      );
      const mD = 1 - weight * beliefs.reduce((a, b) => a + b, 0);
      beliefs.forEach((b, n) => (prodN[n] *= weight * b + mD));
      prodD *= mD;
      prodBar *= 1 - weight;
    }
    const sum = prodN.reduce((a, b) => a + b, 0);
    const mu = 1 / (sum - (hypotheses.length - 1) * prodD);
    const mBar = mu * prodBar;
    if (1 - mBar <= 1e-12) {
      return {
        belief: Object.fromEntries(hypotheses.map((h) => [h, 0])),
        ignorance: 1,
      };
    }
    const belief = Object.fromEntries(
      hypotheses.map((h, n) => [h, (mu * (prodN[n] - prodD)) / (1 - mBar)]),
    );
    return { belief, ignorance: (mu * (prodD - prodBar)) / (1 - mBar) };
  }
}
