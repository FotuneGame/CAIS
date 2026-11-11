import { Event } from '../src/modules/events/types/events.types';
import { AnomaliesService } from '../src/modules/anomalies/anomalies.service';
import { EmergenceService } from '../src/modules/emergence/emergence.service';
import { ReportService } from '../src/modules/report/report.service';
import { StatsService } from '../src/modules/stats/stats.service';

const stats = new StatsService();
const report = new ReportService(
  null as never,
  stats,
  new AnomaliesService(stats),
  new EmergenceService(stats),
);
const time = '2026-11-06T10:00:00.000Z';
const step = (agent: string, tool: string): Event => ({
  time,
  agent,
  type: 'step',
  run: 'r1',
  tool,
  decision: 'ALLOW',
  durationMs: 100,
});

describe('анализ поведения', () => {
  it('энтропия равномерного распределения — 1, одного значения — 0', () => {
    expect(stats.entropy({ a: 5, b: 5 })).toBeCloseTo(1);
    expect(stats.entropy({ a: 5 })).toBe(0);
  });

  it('повтор инструмента 4 раза — петля', () => {
    const events = Array.from({ length: 4 }, () => step('coder', 'read'));
    expect(report.build(events).anomalies).toContainEqual(
      expect.objectContaining({ kind: 'loop', tool: 'read' }),
    );
  });

  it('инъекции и заблокированные действия попадают в аномалии', () => {
    const events: Event[] = [
      { ...step('coder', 'run'), decision: 'BLOCK' },
      { time, agent: 'coder', type: 'injection' },
    ];
    const kinds = report.build(events).anomalies.map((a) => a.kind);
    expect(kinds).toEqual(
      expect.arrayContaining(['blocked_actions', 'injection']),
    );
  });

  it('специализация: агенты используют разные инструменты', () => {
    const events = [
      ...Array.from({ length: 5 }, () => step('a', 'read')),
      ...Array.from({ length: 5 }, () => step('b', 'write')),
    ];
    expect(report.build(events).emergence.specialization).toBeCloseTo(1);
  });
});
