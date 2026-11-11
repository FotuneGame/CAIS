import { Module } from '@nestjs/common';
import { CheckModule } from '../check/check.module';
import { DocsModule } from '../docs/docs.module';
import { TaskModule } from '../task/task.module';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [TaskModule, DocsModule, CheckModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
