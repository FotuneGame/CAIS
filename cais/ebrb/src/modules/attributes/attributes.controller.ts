import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttributesService } from './attributes.service';
import { DeleteDto } from './dto/delete.dto';
import { SaveDto } from './dto/save.dto';

@ApiTags('attributes')
@ApiBearerAuth()
@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  list() {
    return this.attributesService.reload();
  }

  @Post()
  save(@Body() body: SaveDto) {
    return this.attributesService.save([body]);
  }

  @Post('delete')
  @HttpCode(200)
  remove(@Body() body: DeleteDto) {
    return this.attributesService.remove(body.name);
  }
}
