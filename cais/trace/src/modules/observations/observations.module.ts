import { Module } from '@nestjs/common';
import { ObservationsService } from './observations.service';

@Module({
  providers: [ObservationsService],
  exports: [ObservationsService],
})
export class ObservationsModule {}
