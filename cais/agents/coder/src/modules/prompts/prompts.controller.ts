import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateDto } from './dto/update.dto';
import { PromptsService } from './prompts.service';

@ApiTags('prompts')
@ApiBearerAuth()
@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Get()
  list() {
    return this.promptsService.reload();
  }

  @Put()
  update(@Body() body: UpdateDto) {
    return this.promptsService.update(body.name, body.text);
  }
}
