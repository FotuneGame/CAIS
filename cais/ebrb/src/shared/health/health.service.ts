import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ElasticService } from '../elastic/elastic.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly elasticService: ElasticService,
  ) {}

  async check(): Promise<Record<string, string>> {
    return {
      postgres: await this.probe(() => this.dataSource.query('SELECT 1')),
      elasticsearch: await this.probe(() =>
        this.elasticService.request('GET', '/'),
      ),
    };
  }

  private probe(check: () => Promise<unknown>) {
    return check().then(
      () => 'ok',
      (error: Error) => `error: ${error.message}`,
    );
  }
}
