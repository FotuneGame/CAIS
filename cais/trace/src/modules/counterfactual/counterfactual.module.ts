import { Module } from '@nestjs/common';
import { CausalModule } from '../causal/causal.module';
import { HistoryModule } from '../history/history.module';
import { OutcomeModule } from '../outcome/outcome.module';
import { RandomModule } from '../random/random.module';
import { CounterfactualService } from './counterfactual.service';

@Module({
  imports: [CausalModule, OutcomeModule, HistoryModule, RandomModule],
  providers: [CounterfactualService],
  exports: [CounterfactualService],
})
export class CounterfactualModule {}
