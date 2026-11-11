import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickHouseService } from '../../shared/clickhouse/clickhouse.service';
import { EVENTS_QUERY, EVENTS_TABLE } from './constants/events.constants';
import { Event, EventFilter, EventRow } from './types/events.types';

@Injectable()
export class EventsService {
  private ready?: Promise<void>;
  private readonly keepDays: number;

  constructor(
    private readonly clickHouseService: ClickHouseService,
    configService: ConfigService,
  ) {
    this.keepDays = configService.get<number>('trace.keepDays', 30);
  }

  normalize(value: object): Event | null {
    const raw = value as Record<string, unknown>;
    const text = (key: string) =>
      typeof raw[key] === 'string' ? raw[key] : undefined;
    const agent = text('agent');
    const type = text('type');
    if (!agent || !type) return null;
    return {
      time: text('time') ?? new Date().toISOString(),
      agent,
      type,
      run: text('run'),
      tool: text('tool'),
      decision: text('decision'),
      status: text('status'),
      durationMs:
        typeof raw.durationMs === 'number' ? raw.durationMs : undefined,
    };
  }

  async add(events: Event[]) {
    await this.init();
    const rows = events.map((e) => ({
      time: this.toClickHouse(e.time),
      agent: e.agent,
      type: e.type,
      run: e.run ?? '',
      tool: e.tool ?? '',
      decision: e.decision ?? '',
      status: e.status ?? '',
      durationMs: e.durationMs ?? null,
    }));
    await this.clickHouseService.insert('cais_events', rows);
  }

  async find({
    agent = '',
    minutes = 0,
    limit = 10000,
  }: EventFilter): Promise<Event[]> {
    await this.init();
    const rows = await this.clickHouseService.query<EventRow>(EVENTS_QUERY, {
      agent,
      minutes,
      limit,
    });
    return rows.map((row) => ({
      ...row,
      time: `${row.time.replace(' ', 'T')}Z`,
      durationMs: row.durationMs ?? undefined,
    }));
  }

  private toClickHouse(time: string) {
    return new Date(time).toISOString().replace('T', ' ').replace('Z', '');
  }

  private init() {
    this.ready ??= this.clickHouseService
      .exec(EVENTS_TABLE(this.keepDays))
      .catch((error: Error) => {
        this.ready = undefined;
        throw error;
      });
    return this.ready;
  }
}
