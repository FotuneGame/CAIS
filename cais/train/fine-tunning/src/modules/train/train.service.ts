import { BadRequestException, Injectable } from '@nestjs/common';
import { stat } from 'node:fs/promises';
import { StorageService } from '../../shared/storage/storage.service';
import { GgufService } from '../gguf/gguf.service';
import { StartDto } from '../jobs/dto/start.dto';
import { JobPlan } from '../jobs/types/jobs.types';
import { ModelsService } from '../models/models.service';
import { TRAIN_DEFAULTS, TRAIN_MODE } from './constants/train.constants';

@Injectable()
export class TrainService {
  constructor(
    private readonly ggufService: GgufService,
    private readonly modelsService: ModelsService,
    private readonly storageService: StorageService,
  ) {}

  async prepare(
    { base, dataset, model, options = {} }: StartDto,
    owner: string,
  ): Promise<JobPlan> {
    const storage = this.storageService;
    if (base === model)
      throw new BadRequestException('model должна отличаться от base');
    const data = storage.inside(storage.datasetDir, dataset);
    storage.inside(storage.modelsDir, `${model}.gguf`);
    const file = await this.resolve(base);
    const { quantize, ...rest } = options;
    const settings = {
      ...TRAIN_DEFAULTS,
      ...Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined),
      ),
      quantize:
        quantize === 'none' ? null : (quantize ?? TRAIN_DEFAULTS.quantize),
    };
    return {
      request: { owner, trainer: 'gguf', base, dataset, model },
      work: (log) =>
        this.ggufService.train(
          {
            base: file,
            dataset: data,
            output: model,
            mode: TRAIN_MODE,
            options: settings,
          },
          log,
        ),
    };
  }

  private async resolve(base: string) {
    const registered = await this.modelsService.find(base);
    const storage = this.storageService;
    const file =
      registered?.file ??
      storage.inside(
        storage.modelsDir,
        base.endsWith('.gguf') ? base : `${base}.gguf`,
      );
    const found = await stat(file).catch(() => null);
    if (!found) throw new BadRequestException(`нет базовой модели ${base}`);
    return file;
  }
}
