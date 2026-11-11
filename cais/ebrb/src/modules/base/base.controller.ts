import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BaseService } from './base.service';
import { BaseDto } from './dto/base.dto';

@ApiTags('base')
@ApiBearerAuth()
@Controller('base')
export class BaseController {
  constructor(private readonly baseService: BaseService) {}

  @Get()
  export() {
    return this.baseService.export();
  }

  @Post()
  import(@Body() body: BaseDto) {
    return this.baseService.import(body);
  }
}
