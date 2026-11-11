import { Injectable } from '@nestjs/common';
import { Event } from '../events/types/events.types';
import { FACTORS, SLOW_STEP_MS } from './constants/observations.constants';
import { Binary, Observation } from './types/observations.types';

@Injectable()
export class ObservationsService {
  factors(event: Event): string[] {
    const found: string[] = [];
    const { type, decision, status, durationMs } = event;
    if (type === 'violation') found.push('violation');
    if (type === 'injection') found.push('injection');
    if (type === 'step' && decision && decision !== 'ALLOW')
      found.push('blocked_action');
    if (type === 'step' && (durationMs ?? 0) > SLOW_STEP_MS)
      found.push('slow_step');
    if (type === 'run' && status === 'failed') found.push('failed_run');
    if (type === 'job' && status === 'failed') found.push('failed_job');
    if (type === 'decision' && decision === 'ESCALATE')
      found.push('escalation');
    return found;
  }

  fromEvents(events: Event[]) {
    const groups = new Map<string, Observation>();
    for (const event of events) {
      const key = event.run || `${event.agent}@${event.time.slice(0, 16)}`;
      const observation = groups.get(key) ?? new Set<string>();
      this.factors(event).forEach((f) => observation.add(f));
      groups.set(key, observation);
    }
    return { factors: FACTORS, observations: [...groups.values()] };
  }

  fromBinary(rows: Binary[]) {
    const factors = [
      ...new Set(rows.flatMap((row) => Object.keys(row))),
    ].sort();
    const observations = rows.map(
      (row) => new Set(Object.keys(row).filter((f) => Number(row[f]) === 1)),
    );
    return { factors, observations };
  }
}
