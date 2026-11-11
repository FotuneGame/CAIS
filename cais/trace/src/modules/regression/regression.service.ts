import { Injectable } from '@nestjs/common';

@Injectable()
export class RegressionService {
  fit(x: number[][], y: number[], lambda = 1e-3) {
    const p = x[0]?.length ?? 0;
    const a = Array.from({ length: p }, (_, i) =>
      Array.from({ length: p + 1 }, (_, j) => {
        if (j === p) return x.reduce((s, row, k) => s + row[i] * y[k], 0);
        const sum = x.reduce((s, row) => s + row[i] * row[j], 0);
        return sum + (i === j ? lambda : 0);
      }),
    );
    return this.solve(a, p);
  }

  predict(weights: number[], row: number[]) {
    return row.reduce((sum, value, i) => sum + value * (weights[i] ?? 0), 0);
  }

  r2(weights: number[], x: number[][], y: number[]) {
    if (!y.length) return 0;
    const mean = y.reduce((a, b) => a + b, 0) / y.length;
    const total = y.reduce((s, v) => s + (v - mean) ** 2, 0);
    const residual = y.reduce(
      (s, v, k) => s + (v - this.predict(weights, x[k])) ** 2,
      0,
    );
    return total ? 1 - residual / total : residual ? 0 : 1;
  }

  private solve(a: number[][], p: number) {
    for (let col = 0; col < p; col++) {
      let pivot = col;
      for (let r = col + 1; r < p; r++) {
        if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
      }
      [a[col], a[pivot]] = [a[pivot], a[col]];
      if (Math.abs(a[col][col]) < 1e-12) continue;
      for (let r = 0; r < p; r++) {
        if (r === col) continue;
        const factor = a[r][col] / a[col][col];
        for (let c = col; c <= p; c++) a[r][c] -= factor * a[col][c];
      }
    }
    return a.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[p] / row[i]));
  }
}
