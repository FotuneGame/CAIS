import { Body, Controller, HttpCode, OnModuleInit, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BusServerService } from '../../shared/bus-server/bus-server.service';
import { InferDto } from './dto/infer.dto';
import { InferService } from './infer.service';

@ApiTags('infer')
@ApiBearerAuth()
@Controller('infer')
export class InferController implements OnModuleInit {
  constructor(
    private readonly inferService: InferService,
    private readonly busServerService: BusServerService,
  ) {}

  onModuleInit() {
    this.busServerService.handle('infer', InferDto, (body) => this.infer(body));
  }

  @Post()
  @HttpCode(200)
  infer(@Body() body: InferDto) {
    return this.inferService.infer(body);
  }
}
