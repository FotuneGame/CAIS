import { Module } from '@nestjs/common';
import { ConflictService } from './conflict.service';

@Module({
  providers: [ConflictService],
  exports: [ConflictService],
})
export class ConflictModule {}
