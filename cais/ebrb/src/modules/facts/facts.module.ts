import { Module } from '@nestjs/common';
import { ChunkModule } from '../chunk/chunk.module';
import { StoreModule } from '../store/store.module';
import { FactsController } from './facts.controller';
import { FactsService } from './facts.service';

@Module({
  imports: [StoreModule, ChunkModule],
  controllers: [FactsController],
  providers: [FactsService],
  exports: [FactsService],
})
export class FactsModule {}
