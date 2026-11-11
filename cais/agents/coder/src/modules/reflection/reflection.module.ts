import { Module } from '@nestjs/common';
import { PromptsModule } from '../prompts/prompts.module';
import { GoalsModule } from '../goals/goals.module';
import { ReflectionService } from './reflection.service';

@Module({
  imports: [PromptsModule, GoalsModule],
  providers: [ReflectionService],
  exports: [ReflectionService],
})
export class ReflectionModule {}
