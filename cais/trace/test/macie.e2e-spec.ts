import { Test, TestingModule } from '@nestjs/testing';
import { CausalService } from '../src/modules/causal/causal.service';
import { CollectiveService } from '../src/modules/collective/collective.service';
import { CounterfactualService } from '../src/modules/counterfactual/counterfactual.service';
import { Event } from '../src/modules/events/types/events.types';
import { EventsService } from '../src/modules/events/events.service';
import { HistoryService } from '../src/modules/history/history.service';
import { MacieModule } from '../src/modules/macie/macie.module';
import { MacieService } from '../src/modules/macie/macie.service';

const minute = (t: number) =>
  `2026-11-06T10:${String(t).padStart(2, '0')}:00.000Z`;

function events(): Event[] {
  const list: Event[] = [];
  for (let t = 0; t < 40; t++) {
    const time = minute(t);
    const status = t % 2 === 0 ? 'done' : 'failed';
    list.push({ time, agent: 'coder', type: 'run', status });
    list.push({ time, agent: 'ebrb', type: 'decision', decision: 'ALLOW' });
    if (t % 4 === 0) list.push({ time, agent: 'mcp', type: 'violation' });
  }
  return list;
}

describe('MACIE', () => {
  let moduleRef: TestingModule;
  let macie: MacieService;
  let history: HistoryService;
  let causal: CausalService;
  let counterfactual: CounterfactualService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [MacieModule] })
      .overrideProvider(EventsService)
      .useValue({ find: () => Promise.resolve(events()) })
      .compile();
    macie = moduleRef.get(MacieService);
    history = moduleRef.get(HistoryService);
    causal = moduleRef.get(CausalService);
    counterfactual = moduleRef.get(CounterfactualService);
  });

  it('история H: агенты, шаги, награды', () => {
    const h = history.build(events());
    expect(h.agents).toEqual(['coder', 'ebrb', 'mcp']);
    expect(h.steps).toHaveLength(40);
  });

  it('вклады, коллективный интеллект и объяснение', async () => {
    const report = await macie.analyze({
      k: 5,
      b: 50,
      epsilon: 0.5,
      synergy: 0.1,
      si: 0.1,
      seed: 1,
      shapley: true,
      m: null,
      verbosity: 'full',
    });
    expect(report.effects).toHaveLength(3);
    const top = report.effects[0];
    expect(Math.abs(top.phi)).toBeGreaterThanOrEqual(
      Math.abs(report.effects[2].phi),
    );
    const shares = report.effects.reduce((s, e) => s + Math.abs(e.share), 0);
    expect(shares).toBeCloseTo(1);
    expect(Math.abs(report.efficiency.residual)).toBeLessThan(1e-9);
    expect(Number.isFinite(report.collective.si)).toBe(true);
    expect(report.explanation.at(-1)).toContain(`Без ${top.agent}`);
  });

  it('абдукция: без вмешательства контрфактуал равен факту, sₜ из rₜ₋₁', () => {
    const h = history.build(events());
    expect(h.steps[0].state).toBe('neutral');
    expect(h.steps[1].state).toBe(
      h.steps[0].reward > 0 ? 'positive' : 'negative',
    );
    const model = causal.fit(h);
    const run = counterfactual.simulate(h, model, new Set(), () => 0.5);
    run.forEach((r, t) => expect(r).toBeCloseTo(h.steps[t].reward, 9));
  });

  it('SI: знак сохраняется при отрицательных исходах', () => {
    const service = moduleRef.get(CollectiveService);
    const h = history.build(events());
    const model = causal.fit(h);
    const outcome = (c: number[]) => (c.length === 3 ? -2 : -4);
    const { si } = service.measure(h, model, outcome, [0, 0, 0], 0.1);
    expect(si).toBeCloseTo((-2 + 12) / 12);
  });
});
