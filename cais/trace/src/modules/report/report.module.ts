import { Module } from '@nestjs/common';
import { AnomaliesModule } from '../anomalies/anomalies.module';
import { EmergenceModule } from '../emergence/emergence.module';
import { EventsModule } from '../events/events.module';
import { StatsModule } from '../stats/stats.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [EventsModule, StatsModule, AnomaliesModule, EmergenceModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
