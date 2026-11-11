import { Module } from '@nestjs/common';
import { KmeansModule } from '../kmeans/kmeans.module';
import { MeasuresService } from './measures.service';

@Module({
  imports: [KmeansModule],
  providers: [MeasuresService],
  exports: [MeasuresService],
})
export class MeasuresModule {}
