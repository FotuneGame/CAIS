import { registerAs } from '@nestjs/config';

export interface AgentConfig {
  maxSteps: number;
}

export default registerAs('agent', (): AgentConfig => ({
  maxSteps: parseInt(process.env.MAX_STEPS || '5', 10),
}));
