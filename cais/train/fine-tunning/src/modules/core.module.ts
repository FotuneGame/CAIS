import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { ModelsModule } from './models/models.module';

@Module({
  imports: [ModelsModule, JobsModule],
})
export class CoreModule {}
