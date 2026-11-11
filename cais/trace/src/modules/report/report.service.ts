import { Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { Event, EventFilter } from '../events/types/events.types';
import { AnomaliesService } from '../anomalies/anomalies.service';
import { EmergenceService } from '../emergence/emergence.service';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly statsService: StatsService,
    private readonly anomaliesService: AnomaliesService,
    private readonly emergenceService: EmergenceService,
  ) {}

  async create(filter: EventFilter) {
    return this.build(await this.eventsService.find(filter));
  }

  build(events: Event[]) {
    const byAgent = this.statsService.group(events, (e) => e.agent);
    return {
      events: events.length,
      agents: Object.fromEntries(
        Object.entries(byAgent).map(([agent, list]) => [
          agent,
          {
            events: list.length,
            runs: new Set(list.map((e) => e.run).filter(Boolean)).size,
            types: this.statsService.countBy(list, (e) => e.type),
          },
        ]),
      ),
      emergence: this.emergenceService.measure(events),
      anomalies: this.anomaliesService.find(events),
    };
  }
}
