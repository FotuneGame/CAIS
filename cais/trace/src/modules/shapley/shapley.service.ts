import { Injectable } from '@nestjs/common';
import { Value } from './types/shapley.types';

@Injectable()
export class ShapleyService {
  factorial(n: number): number {
    return n <= 1 ? 1 : n * this.factorial(n - 1);
  }

  weight(size: number, n: number) {
    return (
      (this.factorial(size) * this.factorial(n - size - 1)) / this.factorial(n)
    );
  }

  coalitions(others: number[], m: number | null, rng: () => number) {
    const all = 2 ** others.length;
    if (m === null || m >= all) {
      return Array.from({ length: all }, (_, mask) =>
        others.filter((_, b) => mask & (1 << b)),
      );
    }
    const picked = new Map<string, number[]>();
    for (let attempt = 0; picked.size < m && attempt < m * 20; attempt++) {
      const c = others.filter(() => rng() < 0.5);
      picked.set(c.join(','), c);
    }
    return [...picked.values()];
  }

  compute(n: number, value: Value, m: number | null, rng: () => number) {
    return Array.from({ length: n }, (_, i) => {
      const others = Array.from({ length: n }, (__, j) => j).filter(
        (j) => j !== i,
      );
      let weighted = 0;
      let total = 0;
      for (const c of this.coalitions(others, n <= 10 ? null : m, rng)) {
        const w = this.weight(c.length, n);
        weighted += w * (value([...c, i]) - value(c));
        total += w;
      }
      return total ? weighted / total : 0;
    });
  }
}
