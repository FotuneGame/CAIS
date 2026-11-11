import { Module } from '@nestjs/common';
import { CounterfactualModule } from '../counterfactual/counterfactual.module';
import { BootstrapModule } from '../bootstrap/bootstrap.module';
import { EffectsService } from './effects.service';

@Module({
  imports: [CounterfactualModule, BootstrapModule],
  providers: [EffectsService],
  exports: [EffectsService],
})
export class EffectsModule {}
