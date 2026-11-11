import { Module } from '@nestjs/common';
import { PromptsModule } from '../prompts/prompts.module';
import { GoalsService } from './goals.service';

@Module({
  imports: [PromptsModule],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
