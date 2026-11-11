import {
  Body,
  Controller,
  Get,
  HttpCode,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BusServerService } from '../../shared/bus-server/bus-server.service';
import { AddDto } from './dto/add.dto';
import { ReviewDto } from './dto/review.dto';
import { SearchDto } from './dto/search.dto';
import { FactsService } from './facts.service';

@ApiTags('facts')
@ApiBearerAuth()
@Controller('facts')
export class FactsController implements OnModuleInit {
  constructor(
    private readonly factsService: FactsService,
    private readonly busServerService: BusServerService,
  ) {}

  onModuleInit() {
    this.busServerService.handle('facts.add', AddDto, (body) => this.add(body));
    this.busServerService.handle('facts.search', SearchDto, (body) =>
      this.search(body),
    );
  }

  @Get()
  list() {
    return this.factsService.list();
  }

  @Post()
  add(@Body() body: AddDto) {
    return this.factsService.add(body.title, body.text);
  }

  @Post('import')
  @HttpCode(200)
  importFiles() {
    return this.factsService.importFiles();
  }

  @Post('search')
  @HttpCode(200)
  search(@Body() body: SearchDto) {
    return this.factsService.search(body.query, body.limit, body.reviewedOnly);
  }

  @Post('review')
  @HttpCode(200)
  review(@Body() body: ReviewDto) {
    return this.factsService.review(body.title);
  }
}
