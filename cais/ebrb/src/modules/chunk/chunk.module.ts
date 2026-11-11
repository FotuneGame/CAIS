import { Module } from '@nestjs/common';
import { ChunkService } from './chunk.service';

@Module({
  providers: [ChunkService],
  exports: [ChunkService],
})
export class ChunkModule {}
