import { Module } from '@nestjs/common';
import { ShapleyService } from './shapley.service';

@Module({
  providers: [ShapleyService],
  exports: [ShapleyService],
})
export class ShapleyModule {}
