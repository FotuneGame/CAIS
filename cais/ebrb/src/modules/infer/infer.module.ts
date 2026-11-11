import { Module } from '@nestjs/common';
import { ActionsModule } from '../actions/actions.module';
import { AttributesModule } from '../attributes/attributes.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { ExplainModule } from '../explain/explain.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { PlanModule } from '../plan/plan.module';
import { PolicyModule } from '../policy/policy.module';
import { RulesModule } from '../rules/rules.module';
import { ValidationModule } from '../validation/validation.module';
import { InferController } from './infer.controller';
import { InferService } from './infer.service';

@Module({
  imports: [
    AttributesModule,
    RulesModule,
    ActionsModule,
    ExtractionModule,
    ValidationModule,
    PlanModule,
    EvidenceModule,
    PolicyModule,
    ExplainModule,
  ],
  controllers: [InferController],
  providers: [InferService],
})
export class InferModule {}
