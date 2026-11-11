import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { ModelsService } from '../models/models.service';
import { Job } from '../jobs/entity/job.entity';
import { JobRequest, Work } from '../jobs/types/jobs.types';

@Injectable()
export class RunnerService {
  private readonly progress = new Map<string, object[]>();

  constructor(
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    private readonly modelsService: ModelsService,
    private readonly kafkaService: KafkaService,
  ) {}

  current(id: string) {
    return this.progress.get(id);
  }

  async execute(id: string, request: JobRequest, work: Work) {
    const list: object[] = [];
    this.progress.set(id, list);
    const log = (entry: object) => {
      list.push(entry);
      if (list.length > 20) list.shift();
    };
    const patch = await work(log)
      .then(async (result): Promise<Partial<Job>> => {
        const { file, quantized, metrics } = result;
        const { trainer, base, dataset, model } = request;
        await this.modelsService.save({
          name: model,
          trainer,
          base,
          dataset,
          file,
          quantized,
          metrics,
        });
        return { status: 'done', metrics };
      })
      .catch((error: Error): Partial<Job> => ({
        status: 'failed',
        error: error.message,
      }));
    await this.jobs.save({ id, ...patch, progress: list });
    this.progress.delete(id);
    this.kafkaService.publish({
      type: 'job',
      run: id,
      model: request.model,
      status: patch.status,
    });
  }
}
