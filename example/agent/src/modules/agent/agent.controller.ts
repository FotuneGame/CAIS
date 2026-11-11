import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthRequest } from '../../common/guards/auth.guard';
import { KeycloakService } from '../../shared/keycloak/keycloak.service';
import { AgentService } from './agent.service';
import { RunDto } from './dto/run.dto';

@ApiTags('agent')
@ApiBearerAuth()
@Controller('run')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly keycloakService: KeycloakService,
  ) {}

  @Post()
  @HttpCode(200)
  run(@Body() body: RunDto, @Req() req: AuthRequest) {
    return this.agentService.run(
      body.task,
      this.keycloakService.owner(req.user),
    );
  }
}
