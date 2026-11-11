import { ShapleyService } from '../src/modules/shapley/shapley.service';

describe('Шепли (29.13)', () => {
  it('Шепли: эффективность и симметрия на аддитивной игре', () => {
    const shapley = new ShapleyService();
    const values = [1, 2, 3];
    const phi = shapley.compute(
      3,
      (c) => c.reduce((s, i) => s + values[i], 0),
      null,
      () => 0,
    );
    expect(phi.map((v) => Number(v.toFixed(6)))).toEqual(values);
  });

  it('Шепли по M коалициям: аддитивная игра при N > 10', () => {
    const shapley = new ShapleyService();
    const values = Array.from({ length: 12 }, (_, i) => i - 5);
    let seed = 7;
    const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const phi = shapley.compute(
      12,
      (c) => c.reduce((s, i) => s + values[i], 0),
      20,
      rng,
    );
    phi.forEach((v, i) => expect(v).toBeCloseTo(values[i], 9));
  });
});
