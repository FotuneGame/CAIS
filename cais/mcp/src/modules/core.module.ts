import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { McpModule } from './mcp/mcp.module';
import { OauthModule } from './oauth/oauth.module';

@Module({
  imports: [OauthModule, AuditModule, McpModule],
})
export class CoreModule {}
