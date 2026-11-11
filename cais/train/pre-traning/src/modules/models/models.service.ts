import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entity/model.entity';
import { ModelInfo } from './types/models.types';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model) private readonly models: Repository<Model>,
  ) {}

  async save(model: ModelInfo) {
    await this.models.save(model);
  }

  async find(name: string): Promise<ModelInfo | null> {
    const row = await this.models.findOneBy({ name });
    return row ? this.info(row) : null;
  }

  async list(): Promise<ModelInfo[]> {
    const rows = await this.models.find({ order: { name: 'ASC' } });
    return rows.map((row) => this.info(row));
  }

  private info({
    name,
    trainer,
    base,
    dataset,
    file,
    quantized,
    metrics,
  }: Model): ModelInfo {
    return { name, trainer, base, dataset, file, quantized, metrics };
  }
}
