import { Module } from '@nestjs/common';
import { PromptsModule } from '../prompts/prompts.module';
import { ExplainService } from './explain.service';

@Module({
  imports: [PromptsModule],
  providers: [ExplainService],
  exports: [ExplainService],
})
export class ExplainModule {}
