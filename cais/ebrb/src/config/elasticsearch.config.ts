import { registerAs } from '@nestjs/config';

export interface ElasticsearchConfig {
  url: string;
  index: string;
}

export default registerAs('elasticsearch', (): ElasticsearchConfig => ({
  url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  index: process.env.ELASTICSEARCH_INDEX || 'cais-facts',
}));
