import { Injectable } from '@nestjs/common';
import { Method } from '../apriori/types/apriori.types';
import { KmeansService } from '../kmeans/kmeans.service';
import { Observation } from '../observations/types/observations.types';
import { MethodName, METHODS } from './constants/measures.constants';

@Injectable()
export class MeasuresService {
  constructor(private readonly kmeansService: KmeansService) {}

  value(name: MethodName, observations: Observation[], fi: string, fj: string) {
    const n = observations.length || 1;
    const both = observations.filter((o) => o.has(fi) && o.has(fj)).length;
    const a = observations.filter((o) => o.has(fi)).length;
    const b = observations.filter((o) => o.has(fj)).length;
    if (name === 'support') return both / n;
    if (name === 'jaccard') return a + b - both ? both / (a + b - both) : 0;
    if (name === 'lift') return a && b ? (both * n) / (a * b) : 0;
    const neither = n - a - b + both;
    const denominator = Math.sqrt(a * b * (n - a) * (n - b));
    return denominator
      ? (both * neither - (a - both) * (b - both)) / denominator
      : 0;
  }

  matrix(name: MethodName, observations: Observation[], factors: string[]) {
    return factors.map((fi) =>
      factors.map((fj) => this.value(name, observations, fi, fj)),
    );
  }

  kappa(predicted: Set<string>, expected: Set<string>, pairs: string[]) {
    const n = pairs.length;
    if (!n) return 0;
    const agree =
      pairs.filter((p) => predicted.has(p) === expected.has(p)).length / n;
    const pp = predicted.size / n;
    const pe = expected.size / n;
    const chance = pp * pe + (1 - pp) * (1 - pe);
    return chance === 1 ? 1 : (agree - chance) / (1 - chance);
  }

  select(
    observations: Observation[],
    factors: string[],
    expert: string[][],
    clusters: number,
    [w1, w2]: number[],
  ): Method[] {
    const key = (a: string, b: string) => [a, b].sort().join('|');
    const pairs = factors.flatMap((a, i) =>
      factors.slice(i + 1).map((b) => key(a, b)),
    );
    const expected = new Set(expert.map(([a, b]) => key(a, b)));
    return METHODS.map((name) => {
      const values = this.matrix(name, observations, factors);
      const scored = factors
        .flatMap((a, i) =>
          factors
            .slice(i + 1)
            .map((b, j) => ({ pair: key(a, b), v: values[i][i + j + 1] })),
        )
        .sort((x, y) => y.v - x.v);
      const predicted = new Set(
        scored.slice(0, expected.size).map((s) => s.pair),
      );
      const theta = expected.size ? this.kappa(predicted, expected, pairs) : 0;
      const max = Math.max(1e-9, ...values.flat().map(Math.abs));
      const rows = values.map((row) => row.map((v) => v / max));
      const wcss =
        this.kmeansService.cluster(rows, clusters).wcss /
        Math.max(1, factors.length);
      return { name, theta, wcss, delta: w1 * (1 - theta) + w2 * wcss };
    }).sort((a, b) => a.delta - b.delta);
  }
}
