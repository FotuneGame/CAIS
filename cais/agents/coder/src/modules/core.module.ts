import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { PromptsModule } from './prompts/prompts.module';
import { RunsModule } from './runs/runs.module';

@Module({
  imports: [PromptsModule, AgentModule, RunsModule],
})
export class CoreModule {}
