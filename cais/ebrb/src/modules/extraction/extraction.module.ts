import { Module } from '@nestjs/common';
import { FactsModule } from '../facts/facts.module';
import { PromptsModule } from '../prompts/prompts.module';
import { ExtractionService } from './extraction.service';

@Module({
  imports: [FactsModule, PromptsModule],
  providers: [ExtractionService],
  exports: [ExtractionService],
})
export class ExtractionModule {}
