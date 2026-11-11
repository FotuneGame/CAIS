import { Injectable } from '@nestjs/common';

@Injectable()
export class BootstrapService {
  interval(values: number[], b: number, rng: () => number): [number, number] {
    if (!values.length) return [0, 0];
    const sums = Array.from({ length: b }, () => {
      let sum = 0;
      for (let i = 0; i < values.length; i++) {
        sum += values[Math.floor(rng() * values.length)];
      }
      return sum;
    }).sort((x, y) => x - y);
    const at = (q: number) => sums[Math.min(b - 1, Math.floor(q * b))];
    return [at(0.025), at(0.975)];
  }
}
