import { Module } from '@nestjs/common';
import { RegressionModule } from '../regression/regression.module';
import { OutcomeService } from './outcome.service';

@Module({
  imports: [RegressionModule],
  providers: [OutcomeService],
  exports: [OutcomeService],
})
export class OutcomeModule {}
