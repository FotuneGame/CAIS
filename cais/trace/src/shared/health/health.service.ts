import { Injectable } from '@nestjs/common';
import { ClickHouseService } from '../clickhouse/clickhouse.service';

@Injectable()
export class HealthService {
  constructor(private readonly clickHouseService: ClickHouseService) {}

  async check(): Promise<Record<string, string>> {
    const clickhouse = await this.clickHouseService.exec('SELECT 1').then(
      () => 'ok',
      (error: Error) => `error: ${error.message}`,
    );
    return { clickhouse };
  }
}
