import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AprioriService } from './apriori.service';
import { AprioriDto } from './dto/apriori.dto';

@ApiTags('apriori')
@ApiBearerAuth()
@Controller('apriori')
export class AprioriController {
  constructor(private readonly aprioriService: AprioriService) {}

  @Post()
  @HttpCode(200)
  analyze(@Body() body: AprioriDto) {
    return this.aprioriService.analyze(body);
  }
}
