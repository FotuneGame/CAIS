import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { WinstonService } from '../../shared/logger/winston.service';
import { Job } from './entity/job.entity';
import { RunnerService } from '../runner/runner.service';
import { JobRequest, Work } from './types/jobs.types';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly service: string;

  constructor(
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    private readonly runnerService: RunnerService,
    private readonly logger: WinstonService,
    configService: ConfigService,
  ) {
    this.service = configService.get<string>('app.name', 'train');
  }

  async onModuleInit() {
    await this.jobs.update(
      { service: this.service, status: 'running' },
      { status: 'failed', error: 'прервано перезапуском сервиса' },
    );
  }

  async run(request: JobRequest, work: Work) {
    const job: Omit<Job, 'createdAt' | 'updatedAt'> = {
      ...request,
      id: randomUUID(),
      service: this.service,
      status: 'running',
      progress: [],
      metrics: null,
      error: null,
    };
    await this.jobs.save(job);
    void this.runnerService
      .execute(job.id, request, work)
      .catch((error: Error) =>
        this.logger.error(error.message, error.stack, 'Jobs'),
      );
    return job;
  }

  async status(id: string, owner: string) {
    const job = await this.jobs.findOneBy({ id, owner });
    if (!job) throw new NotFoundException('задание не найдено');
    return Object.assign(job, {
      progress: this.runnerService.current(id) ?? job.progress,
    });
  }

  list(owner: string) {
    return this.jobs.find({
      where: { owner },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
