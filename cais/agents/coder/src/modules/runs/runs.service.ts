import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { Repository } from 'typeorm';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { AgentService } from '../agent/agent.service';
import { Run } from './entity/run.entity';

@Injectable()
export class RunsService implements OnModuleInit {
  constructor(
    @InjectRepository(Run) private readonly runs: Repository<Run>,
    private readonly agentService: AgentService,
    private readonly kafkaService: KafkaService,
  ) {}

  async onModuleInit() {
    await this.runs.update(
      { status: 'running' },
      { status: 'failed', error: 'прервана перезапуском агента' },
    );
  }

  async start(task: string, owner: string, waitSeconds: number) {
    const run: Omit<Run, 'createdAt' | 'updatedAt'> = {
      id: randomUUID(),
      owner,
      task,
      status: 'running',
      result: null,
      error: null,
    };
    await this.runs.save(run);
    const finished = this.agentService
      .run(run.id, task)
      .then((result): Partial<Run> => ({ status: 'done', result }))
      .catch((error: Error): Partial<Run> => ({
        status: 'failed',
        error: error.message,
      }))
      .then(async (patch) => {
        await this.runs.save({ id: run.id, ...patch });
        this.kafkaService.publish({
          type: 'run',
          run: run.id,
          status: patch.status,
        });
        return patch;
      });
    const patch = await Promise.race([
      finished,
      sleep(waitSeconds * 1000, undefined, { ref: false }),
    ]);
    return { ...run, ...patch };
  }

  async status(id: string, owner: string) {
    const run = await this.runs.findOneBy({ id, owner });
    if (!run) throw new NotFoundException('задача не найдена');
    return run;
  }
}
