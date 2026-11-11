import { registerAs } from '@nestjs/config';

export interface AgentConfig {
  maxSteps: number;
  maxAttempts: number;
  commandTimeoutMs: number;
}

export default registerAs('agent', (): AgentConfig => ({
  maxSteps: parseInt(process.env.MAX_STEPS || '12', 10),
  maxAttempts: parseInt(process.env.MAX_ATTEMPTS || '2', 10),
  commandTimeoutMs: parseInt(process.env.COMMAND_TIMEOUT_MS || '60000', 10),
}));
