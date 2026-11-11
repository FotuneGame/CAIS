import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateDto } from './dto/create.dto';
import { NotesService } from './notes.service';
import { StatsService } from '../stats/stats.service';

@ApiTags('notes')
@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly statsService: StatsService,
  ) {}

  @Post()
  create(@Body() body: CreateDto) {
    return this.notesService.create(body);
  }

  @Get()
  list() {
    return this.notesService.list();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.statsService.search(query);
  }

  @Get('stats')
  stats() {
    return this.statsService.stats();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.notesService.get(id);
  }

  @Post(':id/file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  attach(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.notesService.attach(id, file);
  }

  @Get(':id/file')
  async download(@Param('id', ParseIntPipe) id: number) {
    const { name, stream } = await this.notesService.download(id);
    return new StreamableFile(stream, {
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    });
  }

  @Post(':id/summary')
  summarize(@Param('id', ParseIntPipe) id: number) {
    return this.notesService.summarize(id);
  }
}
