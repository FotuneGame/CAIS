import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { HistoryModule } from '../history/history.module';
import { CausalModule } from '../causal/causal.module';
import { CounterfactualModule } from '../counterfactual/counterfactual.module';
import { EffectsModule } from '../effects/effects.module';
import { ShapleyModule } from '../shapley/shapley.module';
import { CollectiveModule } from '../collective/collective.module';
import { ExplanationModule } from '../explanation/explanation.module';
import { RandomModule } from '../random/random.module';
import { MacieController } from './macie.controller';
import { MacieService } from './macie.service';

@Module({
  imports: [
    EventsModule,
    HistoryModule,
    CausalModule,
    CounterfactualModule,
    EffectsModule,
    ShapleyModule,
    CollectiveModule,
    ExplanationModule,
    RandomModule,
  ],
  controllers: [MacieController],
  providers: [MacieService],
  exports: [MacieService],
})
export class MacieModule {}
