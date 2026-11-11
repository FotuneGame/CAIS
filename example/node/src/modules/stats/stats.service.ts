import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ClickHouseService } from '../../shared/clickhouse/clickhouse.service';
import { ElasticService } from '../../shared/elastic/elastic.service';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { WinstonService } from '../../shared/logger/winston.service';
import {
  EVENTS_TABLE,
  INDEX,
  STATS_QUERY,
  TOPIC,
} from '../notes/constants/notes.constants';
import { Note } from '../notes/entity/note.entity';

@Injectable()
export class StatsService implements OnApplicationBootstrap {
  constructor(
    private readonly clickHouseService: ClickHouseService,
    private readonly elasticService: ElasticService,
    private readonly kafkaService: KafkaService,
    private readonly logger: WinstonService,
  ) {}

  async onApplicationBootstrap() {
    if (!this.kafkaService.enabled || !this.clickHouseService.enabled) return;
    const clickhouse = this.clickHouseService.client;
    await clickhouse.command({ query: EVENTS_TABLE });
    await this.kafkaService.subscribe<Note>(TOPIC, (note) =>
      clickhouse.insert({
        table: 'note_events',
        values: [{ note_id: note.id, title: note.title }],
        format: 'JSONEachRow',
      }),
    );
    this.logger.log(`события ${TOPIC} пишутся в ClickHouse`, 'Notes');
  }

  async search(query: string) {
    const result = await this.elasticService.client.search<{
      title: string;
      text: string;
    }>({
      index: INDEX,
      ignore_unavailable: true,
      query: { multi_match: { query, fields: ['title', 'text'] } },
    });
    return result.hits.hits.map((hit) => ({
      id: Number(hit._id),
      ...hit._source,
    }));
  }

  async stats() {
    const result = await this.clickHouseService.client.query({
      query: STATS_QUERY,
      format: 'JSONEachRow',
    });
    return result.json();
  }
}
