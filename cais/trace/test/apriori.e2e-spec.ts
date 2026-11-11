import { Test } from '@nestjs/testing';
import { AprioriController } from '../src/modules/apriori/apriori.controller';
import { AprioriModule } from '../src/modules/apriori/apriori.module';
import { EventsService } from '../src/modules/events/events.service';

const rows = [
  { cache_miss: 1, io_wait: 1, swap: 0 },
  { cache_miss: 1, io_wait: 1, swap: 0 },
  { cache_miss: 1, io_wait: 0, swap: 1 },
  { cache_miss: 0, io_wait: 1, swap: 0 },
  { cache_miss: 1, io_wait: 1, swap: 1 },
];

describe('Apriori', () => {
  let controller: AprioriController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AprioriModule],
    })
      .overrideProvider(EventsService)
      .useValue({ find: () => Promise.resolve([]) })
      .compile();
    controller = moduleRef.get(AprioriController);
  });

  it('поддержка пары по формуле (34.6) и симметричная матрица S', async () => {
    const result = await controller.analyze({
      observations: rows,
      minSupport: 0.4,
    });
    const { factors, values } = result.matrix;
    const i = factors.indexOf('cache_miss');
    const j = factors.indexOf('io_wait');
    expect(values[i][j]).toBeCloseTo(3 / 5);
    expect(values[i][j]).toBe(values[j][i]);
  });

  it('Apriori находит частые наборы и строит граф G', async () => {
    const result = await controller.analyze({
      observations: rows,
      minSupport: 0.4,
    });
    expect(result.itemsets.map((s) => s.items.join('+'))).toContain(
      'cache_miss+io_wait',
    );
    expect(result.graph.edges).toContainEqual({
      source: 'cache_miss',
      target: 'io_wait',
      weight: 0.6,
    });
  });

  it('выбор методики m* по δ(m) с экспертными парами', async () => {
    const result = await controller.analyze({
      observations: rows,
      expertPairs: [['cache_miss', 'io_wait']],
    });
    expect(result.methods).toHaveLength(4);
    expect(result.best).toBe(result.methods[0].name);
  });
});
