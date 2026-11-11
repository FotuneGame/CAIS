import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsService {
  mean(xs: number[]) {
    return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  }

  std(xs: number[]) {
    const m = this.mean(xs);
    return Math.sqrt(this.mean(xs.map((x) => (x - m) ** 2)));
  }

  group<T>(items: T[], key: (item: T) => string) {
    const out: Record<string, T[]> = {};
    for (const item of items) (out[key(item)] ??= []).push(item);
    return out;
  }

  countBy<T>(items: T[], key: (item: T) => string) {
    const out: Record<string, number> = {};
    for (const item of items) out[key(item)] = (out[key(item)] ?? 0) + 1;
    return out;
  }

  entropy(counts: Record<string, number>) {
    const values = Object.values(counts);
    const total = values.reduce((a, b) => a + b, 0);
    if (values.length < 2 || !total) return 0;
    const h = -values.reduce(
      (s, c) => (c ? s + (c / total) * Math.log2(c / total) : s),
      0,
    );
    return h / Math.log2(values.length);
  }
}
