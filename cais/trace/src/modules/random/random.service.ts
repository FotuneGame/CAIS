import { Injectable } from '@nestjs/common';

@Injectable()
export class RandomService {
  create(seed: number) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  pick<T>(items: T[], rng: () => number) {
    return items[Math.floor(rng() * items.length)];
  }

  sample(weights: Map<string, number>, rng: () => number) {
    const total = [...weights.values()].reduce((a, b) => a + b, 0);
    let point = rng() * total;
    for (const [value, weight] of weights) {
      point -= weight;
      if (point <= 0) return value;
    }
    return [...weights.keys()].at(-1)!;
  }
}
