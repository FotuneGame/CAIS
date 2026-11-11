import { Module } from '@nestjs/common';
import { AprioriModule } from './apriori/apriori.module';
import { ConsumerModule } from './consumer/consumer.module';
import { EventsModule } from './events/events.module';
import { MacieModule } from './macie/macie.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    EventsModule,
    ConsumerModule,
    ReportModule,
    MacieModule,
    AprioriModule,
  ],
})
export class CoreModule {}
