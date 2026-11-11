import { Module } from '@nestjs/common';
import { OutcomeModule } from '../outcome/outcome.module';
import { InformationModule } from '../information/information.module';
import { RandomModule } from '../random/random.module';
import { CausalService } from './causal.service';

@Module({
  imports: [OutcomeModule, InformationModule, RandomModule],
  providers: [CausalService],
  exports: [CausalService],
})
export class CausalModule {}
