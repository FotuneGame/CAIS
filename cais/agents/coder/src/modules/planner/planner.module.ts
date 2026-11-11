import { Module } from '@nestjs/common';
import { PromptsModule } from '../prompts/prompts.module';
import { GoalsModule } from '../goals/goals.module';
import { PlannerService } from './planner.service';

@Module({
  imports: [PromptsModule, GoalsModule],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}
