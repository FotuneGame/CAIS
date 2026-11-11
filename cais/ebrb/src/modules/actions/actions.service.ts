import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Action } from './entity/action.entity';
import { ActionData } from './types/actions.types';

@Injectable()
export class ActionsService implements OnModuleInit {
  private cache: ActionData[] = [];

  constructor(
    @InjectRepository(Action) private readonly actions: Repository<Action>,
  ) {}

  onModuleInit() {
    return this.reload();
  }

  current() {
    return this.cache;
  }

  safe(name: string | null) {
    return Boolean(name) && this.cache.some((a) => a.name === name && a.safe);
  }

  async reload() {
    const rows = await this.actions.find({ order: { name: 'ASC' } });
    this.cache = rows.map(({ name, description, safe }) => ({
      name,
      description,
      safe,
    }));
    return this.cache;
  }

  async save(actions: ActionData[]) {
    await this.actions.save(actions);
    return this.reload();
  }

  async remove(name: string) {
    const { affected } = await this.actions.delete({ name });
    if (!affected) throw new NotFoundException(`нет действия ${name}`);
    return this.reload();
  }
}
