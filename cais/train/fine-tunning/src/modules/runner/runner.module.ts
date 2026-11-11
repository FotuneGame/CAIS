import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../jobs/entity/job.entity';
import { ModelsModule } from '../models/models.module';
import { RunnerService } from './runner.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job]), ModelsModule],
  providers: [RunnerService],
  exports: [RunnerService],
})
export class RunnerModule {}
