import {
  Body,
  Controller,
  HttpCode,
  OnModuleInit,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JWTPayload } from 'jose';
import type { AuthRequest } from '../../common/guards/auth.guard';
import { BusServerService } from '../../shared/bus-server/bus-server.service';
import { KeycloakService } from '../../shared/keycloak/keycloak.service';
import { StartDto } from './dto/start.dto';
import { StatusDto } from './dto/status.dto';
import { RunsService } from './runs.service';

@ApiTags('runs')
@ApiBearerAuth()
@Controller('runs')
export class RunsController implements OnModuleInit {
  constructor(
    private readonly runsService: RunsService,
    private readonly keycloakService: KeycloakService,
    private readonly busServerService: BusServerService,
  ) {}

  onModuleInit() {
    this.busServerService.handle('runs.start', StartDto, (body, user) =>
      this.run(body, user),
    );
    this.busServerService.handle('runs.status', StatusDto, (body, user) =>
      this.state(body, user),
    );
  }

  @Post()
  start(@Body() body: StartDto, @Req() req: AuthRequest) {
    return this.run(body, req.user);
  }

  @Post('status')
  @HttpCode(200)
  status(@Body() body: StatusDto, @Req() req: AuthRequest) {
    return this.state(body, req.user);
  }

  private run(body: StartDto, user: JWTPayload) {
    const owner = this.keycloakService.owner(user, body.owner);
    return this.runsService.start(body.task, owner, body.wait ?? 0);
  }

  private state(body: StatusDto, user: JWTPayload) {
    const owner = this.keycloakService.owner(user, body.owner);
    return this.runsService.status(body.id, owner);
  }
}
