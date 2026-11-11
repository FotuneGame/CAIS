import { Module } from '@nestjs/common';
import { ActionsModule } from './actions/actions.module';
import { AttributesModule } from './attributes/attributes.module';
import { BaseModule } from './base/base.module';
import { FactsModule } from './facts/facts.module';
import { InferModule } from './infer/infer.module';
import { PromptsModule } from './prompts/prompts.module';
import { RulesModule } from './rules/rules.module';

@Module({
  imports: [
    PromptsModule,
    AttributesModule,
    ActionsModule,
    RulesModule,
    BaseModule,
    FactsModule,
    InferModule,
  ],
})
export class CoreModule {}
