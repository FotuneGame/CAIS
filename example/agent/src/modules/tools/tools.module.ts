import { Module } from '@nestjs/common';
import { CalcModule } from '../calc/calc.module';
import { ToolsService } from './tools.service';

@Module({
  imports: [CalcModule],
  providers: [ToolsService],
  exports: [ToolsService],
})
export class ToolsModule {}
