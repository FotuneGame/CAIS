import { Module } from '@nestjs/common';
import { ActModule } from '../act/act.module';
import { AgentService } from './agent.service';
import { GoalsModule } from '../goals/goals.module';
import { MemoryModule } from '../memory/memory.module';
import { PlannerModule } from '../planner/planner.module';
import { ReflectionModule } from '../reflection/reflection.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [
    GoalsModule,
    PlannerModule,
    ActModule,
    ReflectionModule,
    MemoryModule,
    ToolsModule,
  ],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
