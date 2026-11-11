import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateDto } from './dto/create.dto';
import { FilterDto } from './dto/filter.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async add(@Body() body: CreateDto) {
    const event = this.eventsService.normalize(body);
    await this.eventsService.add([event!]);
    return { stored: true };
  }

  @Post('search')
  @HttpCode(200)
  async search(@Body() body: FilterDto) {
    const { agent, minutes, limit = 100 } = body;
    return { events: await this.eventsService.find({ agent, minutes, limit }) };
  }
}
