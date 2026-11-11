import { Module } from '@nestjs/common';
import { StatsModule } from '../stats/stats.module';
import { EmergenceService } from './emergence.service';

@Module({
  imports: [StatsModule],
  providers: [EmergenceService],
  exports: [EmergenceService],
})
export class EmergenceModule {}
