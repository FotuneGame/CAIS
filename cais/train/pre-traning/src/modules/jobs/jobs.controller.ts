import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthRequest } from '../../common/guards/auth.guard';
import { KeycloakService } from '../../shared/keycloak/keycloak.service';
import { StartDto } from './dto/start.dto';
import { StatusDto } from './dto/status.dto';
import { JobsService } from './jobs.service';
import { TrainService } from '../train/train.service';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly trainService: TrainService,
    private readonly jobsService: JobsService,
    private readonly keycloakService: KeycloakService,
  ) {}

  @Post()
  async start(@Body() body: StartDto, @Req() req: AuthRequest) {
    const owner = this.keycloakService.owner(req.user);
    const { request, work } = await this.trainService.prepare(body, owner);
    return this.jobsService.run(request, work);
  }

  @Post('status')
  @HttpCode(200)
  status(@Body() body: StatusDto, @Req() req: AuthRequest) {
    return this.jobsService.status(
      body.id,
      this.keycloakService.owner(req.user),
    );
  }

  @Get()
  async list(@Req() req: AuthRequest) {
    return {
      jobs: await this.jobsService.list(this.keycloakService.owner(req.user)),
    };
  }
}
