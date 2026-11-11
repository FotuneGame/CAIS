import { Module } from '@nestjs/common';
import { SimilarityModule } from '../similarity/similarity.module';
import { ActivationModule } from '../activation/activation.module';
import { ReasoningModule } from '../reasoning/reasoning.module';
import { ConflictModule } from '../conflict/conflict.module';
import { EvidenceService } from './evidence.service';

@Module({
  imports: [
    SimilarityModule,
    ActivationModule,
    ReasoningModule,
    ConflictModule,
  ],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
