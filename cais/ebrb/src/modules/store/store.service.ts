import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticService } from '../../shared/elastic/elastic.service';
import { Fact, FactsInfo, Hit } from '../facts/types/facts.types';
import {
  INDEX_MAPPING,
  LIST_AGGREGATION,
  REVIEW_SCRIPT,
} from './constants/store.constants';
import { ListResult, SearchResult, Updated } from './types/store.types';

@Injectable()
export class StoreService {
  private readonly index: string;
  private created?: Promise<void>;

  constructor(
    private readonly elasticService: ElasticService,
    configService: ConfigService,
  ) {
    this.index = configService.get<string>('elasticsearch.index', 'cais-facts');
  }

  async replace(title: string, facts: Fact[]) {
    await this.request('POST', '_delete_by_query?refresh=true', {
      query: { term: { title } },
    });
    const lines = facts.flatMap(({ id, ...doc }) => [
      JSON.stringify({ index: { _index: this.index, _id: id } }),
      JSON.stringify(doc),
    ]);
    if ((await this.elasticService.bulk(lines)).errors) {
      throw new Error('Elasticsearch: не все факты сохранены');
    }
  }

  async search(
    query: string,
    limit: number,
    reviewedOnly = false,
  ): Promise<Hit[]> {
    const filter = [{ term: { injection: false } }];
    if (reviewedOnly) filter.push({ term: { reviewed: true } } as never);
    const res = await this.request<SearchResult>('POST', '_search', {
      size: limit,
      query: {
        bool: {
          must: { multi_match: { query, fields: ['text', 'title.search^2'] } },
          filter,
        },
      },
    });
    return res.hits.hits.map((hit) => ({
      ...hit._source,
      id: hit._id,
      score: hit._score,
    }));
  }

  async review(title: string) {
    const body = { query: { term: { title } }, script: REVIEW_SCRIPT };
    const res = await this.request<Updated>(
      'POST',
      '_update_by_query?refresh=true',
      body,
    );
    return res.updated;
  }

  async list(): Promise<FactsInfo[]> {
    const body = { size: 0, aggs: LIST_AGGREGATION };
    const res = await this.request<ListResult>('POST', '_search', body);
    return res.aggregations.titles.buckets.map((b) => ({
      title: b.key,
      chunks: b.doc_count,
      injection: b.injection.doc_count > 0,
      reviewed: b.reviewed.doc_count === b.doc_count,
    }));
  }

  private async request<T>(method: string, path: string, body: object) {
    this.created ??= this.create().catch((error: Error) => {
      this.created = undefined;
      throw error;
    });
    await this.created;
    return this.elasticService.request<T>(
      method,
      `/${this.index}/${path}`,
      body,
    );
  }

  private async create() {
    if (await this.elasticService.exists(`/${this.index}`)) return;
    await this.elasticService.request('PUT', `/${this.index}`, INDEX_MAPPING);
  }
}
