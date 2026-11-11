import { Module } from '@nestjs/common';
import { ItemsetsService } from './itemsets.service';

@Module({
  providers: [ItemsetsService],
  exports: [ItemsetsService],
})
export class ItemsetsModule {}
