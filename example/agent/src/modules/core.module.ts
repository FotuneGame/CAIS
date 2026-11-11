import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { PromptsModule } from './prompts/prompts.module';

@Module({
  imports: [PromptsModule, AgentModule],
})
export class CoreModule {}
