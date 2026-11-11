import { registerAs } from '@nestjs/config';

export interface ServicesConfig {
  agents: string[];
}

export default registerAs('services', (): ServicesConfig => ({
  agents: (process.env.AGENTS || 'coder').split(',').filter(Boolean),
}));
