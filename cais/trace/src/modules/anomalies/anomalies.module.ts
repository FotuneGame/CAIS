import { Module } from '@nestjs/common';
import { StatsModule } from '../stats/stats.module';
import { AnomaliesService } from './anomalies.service';

@Module({
  imports: [StatsModule],
  providers: [AnomaliesService],
  exports: [AnomaliesService],
})
export class AnomaliesModule {}
