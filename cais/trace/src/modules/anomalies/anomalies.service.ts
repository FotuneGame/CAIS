import { Injectable } from '@nestjs/common';
import { Event } from '../events/types/events.types';
import { StatsService } from '../stats/stats.service';
import { Anomaly } from './types/anomalies.types';

@Injectable()
export class AnomaliesService {
  constructor(private readonly statsService: StatsService) {}

  find(events: Event[]) {
    const byAgent = this.statsService.group(events, (e) => e.agent);
    return Object.entries(byAgent).flatMap(([agent, list]) => {
      const steps = list.filter((e) => e.type === 'step');
      const timed = steps.filter((e) => Number.isFinite(e.durationMs));
      return [
        ...this.slowSteps(agent, timed),
        ...this.loops(agent, steps),
        ...this.counters(agent, list, steps),
      ];
    });
  }

  private slowSteps(agent: string, steps: Event[]): Anomaly[] {
    const durations = steps.map((e) => e.durationMs as number);
    const m = this.statsService.mean(durations);
    const s = this.statsService.std(durations);
    if (durations.length < 10 || s === 0) return [];
    return steps
      .filter((e) => ((e.durationMs as number) - m) / s > 3)
      .map((e) => ({
        kind: 'slow_step',
        agent,
        run: e.run,
        durationMs: e.durationMs,
      }));
  }

  private loops(agent: string, steps: Event[]): Anomaly[] {
    const found: Anomaly[] = [];
    const byRun = this.statsService.group(steps, (e) => e.run ?? '-');
    for (const [run, list] of Object.entries(byRun)) {
      let streak = 1;
      for (let i = 1; i < list.length; i++) {
        streak = list[i].tool === list[i - 1].tool ? streak + 1 : 1;
        if (streak === 4)
          found.push({ kind: 'loop', agent, run, tool: list[i].tool });
      }
    }
    return found;
  }

  private counters(agent: string, list: Event[], steps: Event[]): Anomaly[] {
    const found: Anomaly[] = [];
    const violations = list.filter((e) => e.type === 'violation').length;
    const share = violations / (steps.length + violations || 1);
    if (steps.length + violations >= 5 && share > 0.3) {
      found.push({
        kind: 'violations',
        agent,
        share: Number(share.toFixed(2)),
      });
    }
    const count = (kind: string, n: number) =>
      n && found.push({ kind, agent, count: n });
    count(
      'blocked_actions',
      steps.filter((e) => e.decision && e.decision !== 'ALLOW').length,
    );
    count(
      'failed_runs',
      list.filter((e) => e.type === 'run' && e.status === 'failed').length,
    );
    count('injection', list.filter((e) => e.type === 'injection').length);
    return found;
  }
}
