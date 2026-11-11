import { Injectable } from '@nestjs/common';

@Injectable()
export class InformationService {
  counts(values: string[]) {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  }

  entropy(values: string[]) {
    return [...this.counts(values).values()].reduce((h, c) => {
      const p = c / values.length;
      return h - p * Math.log(p);
    }, 0);
  }

  mutual(xs: string[], ys: string[]) {
    const joint = xs.map((x, k) => `${x}\u0001${ys[k]}`);
    return Math.max(
      0,
      this.entropy(xs) + this.entropy(ys) - this.entropy(joint),
    );
  }

  conditional(xs: string[], ys: string[], zs: string[]) {
    const groups = new Map<string, number[]>();
    zs.forEach((z, k) => groups.set(z, [...(groups.get(z) ?? []), k]));
    let total = 0;
    for (const indices of groups.values()) {
      const weight = indices.length / zs.length;
      total +=
        weight *
        this.mutual(
          indices.map((k) => xs[k]),
          indices.map((k) => ys[k]),
        );
    }
    return total;
  }

  dependent(xs: string[], ys: string[]) {
    const df = (new Set(xs).size - 1) * (new Set(ys).size - 1);
    if (df <= 0 || xs.length < 3) return false;
    const g = 2 * xs.length * this.mutual(xs, ys);
    const z = 1.645;
    const critical = df * (1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df))) ** 3;
    return g > critical;
  }

  correlation(a: number[], b: number[]) {
    const n = a.length;
    if (!n) return 0;
    const ma = a.reduce((s, v) => s + v, 0) / n;
    const mb = b.reduce((s, v) => s + v, 0) / n;
    let cov = 0;
    let va = 0;
    let vb = 0;
    for (let i = 0; i < n; i++) {
      cov += (a[i] - ma) * (b[i] - mb);
      va += (a[i] - ma) ** 2;
      vb += (b[i] - mb) ** 2;
    }
    return va && vb ? cov / Math.sqrt(va * vb) : 0;
  }
}
