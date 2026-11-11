import { Injectable } from '@nestjs/common';
import { Event } from '../events/types/events.types';
import { IDLE, NEUTRAL, REWARDS } from './constants/history.constants';
import { History, State } from './types/history.types';

@Injectable()
export class HistoryService {
  reward(event: Event) {
    const detail = event.status ?? event.decision;
    return REWARDS[`${event.type}:${detail}`] ?? REWARDS[event.type] ?? 0;
  }

  action(event: Event) {
    return event.tool ? `${event.type}:${event.tool}` : event.type;
  }

  state(previousReward: number): State {
    if (previousReward > NEUTRAL) return 'positive';
    return previousReward < -NEUTRAL ? 'negative' : 'neutral';
  }

  build(events: Event[]): History {
    const agents = [...new Set(events.map((e) => e.agent))].sort();
    const buckets = new Map<string, Event[]>();
    for (const event of events) {
      const key = event.time.slice(0, 16);
      buckets.set(key, [...(buckets.get(key) ?? []), event]);
    }
    let previous = 0;
    const steps = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, list]) => {
        const reward = list.reduce((sum, e) => sum + this.reward(e), 0);
        const actions = agents.map((agent) =>
          this.mostFrequent(
            list.filter((e) => e.agent === agent).map((e) => this.action(e)),
          ),
        );
        const step = { time, state: this.state(previous), actions, reward };
        previous = reward;
        return step;
      });
    return { agents, steps };
  }

  private mostFrequent(values: string[]) {
    if (!values.length) return IDLE;
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0][0];
  }
}
