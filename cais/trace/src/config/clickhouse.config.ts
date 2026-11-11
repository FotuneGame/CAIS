import { registerAs } from '@nestjs/config';

export interface ClickHouseConfig {
  url: string;
  username: string;
  password: string;
  database: string;
}

export default registerAs('clickhouse', (): ClickHouseConfig => ({
  url: process.env.CLICKHOUSE_URL || '',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DB || 'default',
}));
