import { Body, Controller, HttpCode, OnModuleInit, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BusServerService } from '../../shared/bus-server/bus-server.service';
import { FilterDto } from '../events/dto/filter.dto';
import { ReportService } from './report.service';

@ApiTags('report')
@ApiBearerAuth()
@Controller('report')
export class ReportController implements OnModuleInit {
  constructor(
    private readonly reportService: ReportService,
    private readonly busServerService: BusServerService,
  ) {}

  onModuleInit() {
    this.busServerService.handle('report', FilterDto, (body) =>
      this.report(body),
    );
  }

  @Post()
  @HttpCode(200)
  report(@Body() body: FilterDto) {
    return this.reportService.create({
      agent: body.agent,
      minutes: body.minutes,
    });
  }
}
