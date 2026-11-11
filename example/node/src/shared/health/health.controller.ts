import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get()
  async check() {
    const services = await this.healthService.check();
    if (Object.values(services).some((state) => state.startsWith('error'))) {
      throw new ServiceUnavailableException({ services });
    }
    return { services };
  }
}
