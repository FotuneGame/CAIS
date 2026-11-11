import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RunnerModule } from '../runner/runner.module';
import { TrainModule } from '../train/train.module';
import { Job } from './entity/job.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job]), RunnerModule, TrainModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
