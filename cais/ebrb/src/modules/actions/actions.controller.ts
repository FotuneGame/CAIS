import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActionsService } from './actions.service';
import { DeleteDto } from './dto/delete.dto';
import { SaveDto } from './dto/save.dto';

@ApiTags('actions')
@ApiBearerAuth()
@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  list() {
    return this.actionsService.reload();
  }

  @Post()
  save(@Body() body: SaveDto) {
    return this.actionsService.save([body]);
  }

  @Post('delete')
  @HttpCode(200)
  remove(@Body() body: DeleteDto) {
    return this.actionsService.remove(body.name);
  }
}
