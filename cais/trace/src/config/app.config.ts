import { registerAs } from '@nestjs/config';

export interface AppConfig {
  name: string;
  port: number;
  publicUrl: string;
  dev: boolean;
}

export default registerAs('app', (): AppConfig => ({
  name: process.env.APP_NAME || 'app',
  port: parseInt(process.env.PORT || '3000', 10),
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  dev: process.env.DEV === 'true',
}));
