import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ItemsetsModule } from '../itemsets/itemsets.module';
import { MeasuresModule } from '../measures/measures.module';
import { ObservationsModule } from '../observations/observations.module';
import { AprioriController } from './apriori.controller';
import { AprioriService } from './apriori.service';

@Module({
  imports: [EventsModule, ItemsetsModule, MeasuresModule, ObservationsModule],
  controllers: [AprioriController],
  providers: [AprioriService],
  exports: [AprioriService],
})
export class AprioriModule {}
