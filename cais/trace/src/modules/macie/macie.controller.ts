import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MACIE_DEFAULTS } from './constants/macie.constants';
import { MacieDto } from './dto/macie.dto';
import { MacieService } from './macie.service';

@ApiTags('macie')
@ApiBearerAuth()
@Controller('macie')
export class MacieController {
  constructor(private readonly macieService: MacieService) {}

  @Post()
  @HttpCode(200)
  analyze(@Body() body: MacieDto) {
    return this.macieService.analyze({
      minutes: body.minutes,
      k: body.k ?? MACIE_DEFAULTS.k,
      b: body.b ?? MACIE_DEFAULTS.b,
      epsilon: body.epsilon ?? MACIE_DEFAULTS.epsilon,
      synergy: body.synergy ?? MACIE_DEFAULTS.synergy,
      si: body.si ?? MACIE_DEFAULTS.si,
      seed: body.seed ?? MACIE_DEFAULTS.seed,
      shapley: body.shapley ?? MACIE_DEFAULTS.shapley,
      m: body.m ?? null,
      verbosity: body.verbosity ?? MACIE_DEFAULTS.verbosity,
    });
  }
}
