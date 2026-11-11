import { ActivationService } from '../src/modules/activation/activation.service';
import { AttributeData } from '../src/modules/attributes/types/attributes.types';
import { Extracted } from '../src/modules/infer/types/infer.types';
import { ReasoningService } from '../src/modules/reasoning/reasoning.service';
import { RuleData } from '../src/modules/rules/types/rules.types';
import { SimilarityService } from '../src/modules/similarity/similarity.service';

const similarity = new SimilarityService();
const activation = new ActivationService();
const reasoning = new ReasoningService();
const attributes = new Map<string, AttributeData>([
  [
    'risk',
    {
      name: 'risk',
      description: 'риск',
      weight: 1,
      referential: [0, 0.5, 1],
      required: true,
    },
  ],
]);
const rule = (
  id: string,
  risk: number,
  consequent: Record<string, number>,
): RuleData => ({
  id,
  antecedents: { risk },
  consequent,
  weight: 1,
  reliability: 1,
  source: 'expert',
  reviewed: true,
});
const rules = [rule('safe', 0, { ALLOW: 1 }), rule('danger', 1, { BLOCK: 1 })];

function belief(input: Extracted) {
  const matches = rules.map((r) => similarity.match(r, input, attributes));
  const weights = activation.activate(rules, matches, attributes);
  const evidence = rules.map((r, k) => ({
    consequent: r.consequent,
    weight: weights[k],
    completeness: matches[k].completeness,
  }));
  return reasoning.combine(evidence, ['ALLOW', 'BLOCK']);
}

describe('EBRB: формулы (13.3)–(13.5)', () => {
  it('значение раскладывается по референтным значениям', () => {
    expect(similarity.distribution(0.25, [0, 0.5, 1])).toEqual([0.5, 0.5, 0]);
    expect(similarity.similarity([1, 0, 0], [1, 0, 0])).toBe(1);
  });

  it('сходство взвешивается уверенностью извлечения (13.3)', () => {
    const match = similarity.match(
      rules[0],
      { risk: { value: 0, confidence: 0.4 } },
      attributes,
    );
    expect(match.similarity.risk).toBeCloseTo(0.4);
  });

  it('безопасное действие получает наибольшее убеждение ALLOW', () => {
    const result = belief({ risk: { value: 0, confidence: 1 } });
    expect(result.belief.ALLOW).toBeGreaterThan(0.9);
  });

  it('низкая уверенность извлечения увеличивает βΘ', () => {
    const sure = belief({ risk: { value: 0, confidence: 1 } });
    const unsure = belief({ risk: { value: 0, confidence: 0.3 } });
    expect(unsure.ignorance).toBeGreaterThan(sure.ignorance);
  });

  it('активация (13.4): δ̄ = δ / max δ при весах меньше 1', () => {
    const light = new Map(
      [...attributes].map(([name, a]) => [name, { ...a, weight: 0.5 }]),
    );
    const input = { risk: { value: 0.25, confidence: 1 } };
    const matches = rules.map((r) => similarity.match(r, input, light));
    const scaled = activation.activate(rules, matches, light);
    const base = rules.map((r) => similarity.match(r, input, attributes));
    expect(scaled).toEqual(activation.activate(rules, base, attributes));
  });

  it('ER: одно правило с полной активацией даёт его распределение', () => {
    const evidence = [
      { consequent: { A: 0.7, B: 0.2 }, weight: 1, completeness: 1 },
    ];
    const { belief: b, ignorance } = reasoning.combine(evidence, ['A', 'B']);
    expect(b.A).toBeCloseTo(0.7);
    expect(ignorance).toBeCloseTo(0.1);
  });
});
