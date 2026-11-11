import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agent/agent.module';
import { Run } from './entity/run.entity';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Run]), AgentModule],
  controllers: [RunsController],
  providers: [RunsService],
})
export class RunsModule {}
