import { Module } from '@nestjs/common';
import { ActionsModule } from '../actions/actions.module';
import { PromptsModule } from '../prompts/prompts.module';
import { PlanService } from './plan.service';

@Module({
  imports: [ActionsModule, PromptsModule],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
