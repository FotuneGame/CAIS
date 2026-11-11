import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/guards/auth.guard';

@Public()
@ApiTags('oauth')
@Controller('.well-known/oauth-protected-resource')
export class OauthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  metadata() {
    const issuers = this.configService.get<string[]>('keycloak.issuers', []);
    return {
      resource: this.configService.get<string>('app.publicUrl'),
      authorization_servers: issuers.slice(0, 1),
      bearer_methods_supported: ['header'],
      resource_name: 'CAIS MCP',
    };
  }
}
