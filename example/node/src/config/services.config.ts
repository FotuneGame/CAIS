import { registerAs } from '@nestjs/config';

export interface ServicesConfig {
  redis: { host: string; password: string };
  elasticsearch: { url: string };
  s3: { url: string; accessKey: string; secretKey: string; bucket: string };
  llm: { url: string; model: string };
}

export default registerAs('services', (): ServicesConfig => ({
  redis: {
    host: process.env.REDIS_HOST || '',
    password: process.env.REDIS_PASSWORD || '',
  },
  elasticsearch: { url: process.env.ELASTICSEARCH_URL || '' },
  s3: {
    url: process.env.S3_URL || '',
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
    bucket: process.env.S3_BUCKET || 'app',
  },
  llm: {
    url: process.env.LLM_URL || '',
    model: process.env.LLM_MODEL || 'Qwen3.5-4B',
  },
}));
