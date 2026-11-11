import { Module } from '@nestjs/common';
import { CausalModule } from '../causal/causal.module';
import { InformationModule } from '../information/information.module';
import { CollectiveService } from './collective.service';

@Module({
  imports: [InformationModule, CausalModule],
  providers: [CollectiveService],
  exports: [CollectiveService],
})
export class CollectiveModule {}
