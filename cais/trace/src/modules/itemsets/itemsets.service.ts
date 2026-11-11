import { Injectable } from '@nestjs/common';
import { Observation } from '../observations/types/observations.types';
import { Edge, Itemset, Matrix } from '../apriori/types/apriori.types';

@Injectable()
export class ItemsetsService {
  support(observations: Observation[], items: string[]) {
    if (!observations.length) return 0;
    const count = observations.filter((o) =>
      items.every((i) => o.has(i)),
    ).length;
    return count / observations.length;
  }

  frequent(
    observations: Observation[],
    factors: string[],
    minSupport: number,
    maxSize: number,
  ) {
    const result: Itemset[] = [];
    let level = factors
      .map((f) => ({ items: [f], support: this.support(observations, [f]) }))
      .filter((s) => s.support >= minSupport);
    while (level.length && level[0].items.length <= maxSize) {
      result.push(...level);
      const known = new Set(level.map((s) => s.items.join('|')));
      const candidates = new Map<string, string[]>();
      for (let a = 0; a < level.length; a++) {
        for (let b = a + 1; b < level.length; b++) {
          const items = [
            ...new Set([...level[a].items, ...level[b].items]),
          ].sort();
          if (items.length !== level[a].items.length + 1) continue;
          const subsets = items.map((_, k) =>
            items.filter((__, j) => j !== k).join('|'),
          );
          if (subsets.every((s) => known.has(s)))
            candidates.set(items.join('|'), items);
        }
      }
      level = [...candidates.values()]
        .map((items) => ({ items, support: this.support(observations, items) }))
        .filter((s) => s.support >= minSupport);
    }
    return result.sort((a, b) => b.support - a.support);
  }

  matrix(observations: Observation[], factors: string[]): Matrix {
    const values = factors.map((fi) =>
      factors.map((fj) =>
        this.support(observations, fi === fj ? [fi] : [fi, fj]),
      ),
    );
    return { factors, values };
  }

  graph({ factors, values }: Matrix, minSupport: number) {
    const edges: Edge[] = [];
    factors.forEach((source, i) =>
      factors.forEach((target, j) => {
        if (j > i && values[i][j] >= minSupport && values[i][j] > 0) {
          edges.push({ source, target, weight: values[i][j] });
        }
      }),
    );
    return { nodes: factors, edges };
  }
}
