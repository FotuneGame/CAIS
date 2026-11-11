import { Module } from '@nestjs/common';
import { ActionsModule } from '../actions/actions.module';
import { AttributesModule } from '../attributes/attributes.module';
import { RulesModule } from '../rules/rules.module';
import { BaseController } from './base.controller';
import { BaseService } from './base.service';

@Module({
  imports: [AttributesModule, ActionsModule, RulesModule],
  controllers: [BaseController],
  providers: [BaseService],
})
export class BaseModule {}
