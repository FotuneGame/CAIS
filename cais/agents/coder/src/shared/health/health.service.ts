import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access, constants, mkdir } from 'node:fs/promises';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async check(): Promise<Record<string, string>> {
    const dir = this.configService.get<string>('app.appDataPath', './app-data');
    return {
      postgres: await this.probe(() => this.dataSource.query('SELECT 1')),
      'app-data': await this.probe(async () => {
        await mkdir(dir, { recursive: true });
        await access(dir, constants.W_OK);
      }),
    };
  }

  private probe(check: () => Promise<unknown>) {
    return check().then(
      () => 'ok',
      (error: Error) => `error: ${error.message}`,
    );
  }
}
