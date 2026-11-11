import { Module } from '@nestjs/common';
import { KmeansService } from './kmeans.service';

@Module({
  providers: [KmeansService],
  exports: [KmeansService],
})
export class KmeansModule {}
