import { Injectable } from '@nestjs/common';
import { Event } from '../events/types/events.types';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class EmergenceService {
  constructor(private readonly statsService: StatsService) {}

  measure(events: Event[]) {
    const stats = this.statsService;
    const byAgent = stats.group(events, (e) => e.agent);
    const steps = events.filter((e) => e.type === 'step' && e.tool);
    const toolCounts = (list: Event[]) =>
      stats.countBy(list, (e) => e.tool as string);
    const agentEntropy = stats.mean(
      Object.values(stats.group(steps, (e) => e.agent)).map((list) =>
        stats.entropy(toolCounts(list)),
      ),
    );
    const groupEntropy = stats.entropy(toolCounts(steps));
    const minutes = Object.values(byAgent).map(
      (list) => new Set(list.map((e) => e.time.slice(0, 16))),
    );
    const all = new Set(minutes.flatMap((s) => [...s]));
    const shared = [...all].filter(
      (m) => minutes.filter((s) => s.has(m)).length > 1,
    ).length;
    return {
      agents: Object.keys(byAgent).length,
      toolDiversity: Number(groupEntropy.toFixed(3)),
      specialization: Number(
        Math.max(0, groupEntropy - agentEntropy).toFixed(3),
      ),
      synchrony: Number((all.size ? shared / all.size : 0).toFixed(3)),
    };
  }
}
