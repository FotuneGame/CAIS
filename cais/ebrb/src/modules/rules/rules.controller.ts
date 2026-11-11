import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IdDto } from './dto/id.dto';
import { LearnDto } from './dto/learn.dto';
import { SaveDto } from './dto/save.dto';
import { RulesService } from './rules.service';

@ApiTags('rules')
@ApiBearerAuth()
@Controller()
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get('rules')
  list() {
    return this.rulesService.reload();
  }

  @Post('rules')
  save(@Body() body: SaveDto) {
    return this.rulesService.save([body]);
  }

  @Post('rules/review')
  @HttpCode(200)
  review(@Body() body: IdDto) {
    return this.rulesService.review(body.id);
  }

  @Post('rules/delete')
  @HttpCode(200)
  remove(@Body() body: IdDto) {
    return this.rulesService.remove(body.id);
  }

  @Post('learn')
  learn(@Body() body: LearnDto) {
    return this.rulesService.learn(body.samples);
  }
}
