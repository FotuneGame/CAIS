import { Injectable } from '@nestjs/common';

@Injectable()
export class KmeansService {
  cluster(points: number[][], k: number, iterations = 50) {
    if (!points.length) return { assignments: [], wcss: 0 };
    const count = Math.min(k, points.length);
    let centers = points.slice(0, count).map((p) => [...p]);
    let assignments = points.map(() => 0);
    const distance = (a: number[], b: number[]) =>
      a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0);
    for (let step = 0; step < iterations; step++) {
      assignments = points.map((p) => {
        const d = centers.map((c) => distance(p, c));
        return d.indexOf(Math.min(...d));
      });
      centers = centers.map((center, c) => {
        const members = points.filter((_, i) => assignments[i] === c);
        if (!members.length) return center;
        return center.map(
          (_, d) => members.reduce((s, m) => s + m[d], 0) / members.length,
        );
      });
    }
    const wcss = points.reduce(
      (sum, p, i) => sum + distance(p, centers[assignments[i]]),
      0,
    );
    return { assignments, wcss };
  }
}
