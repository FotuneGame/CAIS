import { Injectable } from '@nestjs/common';
import { mkdir, rename, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { StorageService } from '../../shared/storage/storage.service';
import { DatasetService } from '../dataset/dataset.service';
import { LlamaService } from '../llama/llama.service';
import { GgufTask, Log, Trained } from './types/gguf.types';

@Injectable()
export class GgufService {
  constructor(
    private readonly llamaService: LlamaService,
    private readonly datasetService: DatasetService,
    private readonly storageService: StorageService,
  ) {}

  async train(
    { base, dataset, output, mode, options }: GgufTask,
    log: Log,
  ): Promise<Trained> {
    const dir = this.storageService.modelsDir;
    const workDir = join(dir, '.work', output);
    await mkdir(workDir, { recursive: true });
    const data = await this.datasetService.prepare(dataset, mode, workDir);
    const file = join(dir, `${output}.gguf`);
    const metrics: Record<string, number> = {};
    if (options.evaluate) {
      metrics.perplexityBefore = await this.llamaService.perplexity(
        base,
        data,
        options.context,
        log,
      );
    }
    log({ stage: 'finetune', base, data });
    await this.llamaService.finetune(
      {
        model: base,
        data,
        output: file,
        context: options.context,
        batch: options.batch,
        epochs: options.epochs,
        lr: options.lr,
      },
      workDir,
      log,
    );
    await this.moveDefaultOutput(workDir, file);
    if (options.evaluate) {
      metrics.perplexity = await this.llamaService.perplexity(
        file,
        data,
        options.context,
        log,
      );
    }
    metrics.sizeMb = Math.round((await stat(file)).size / 1048576);
    let quantized: string | null = null;
    if (options.quantize) {
      quantized = join(dir, `${output}-${options.quantize}.gguf`);
      log({ stage: 'quantize', type: options.quantize });
      await this.llamaService.quantize(file, quantized, options.quantize, log);
    }
    return { file, quantized, metrics };
  }

  private async moveDefaultOutput(workDir: string, file: string) {
    if (await this.exists(file)) return;
    for (const name of ['finetuned-model.gguf', 'ggml-model-f32.gguf']) {
      const candidate = join(workDir, name);
      if (await this.exists(candidate)) return rename(candidate, file);
    }
    throw new Error(`llama-finetune не создал ${file}`);
  }

  private exists(path: string) {
    return stat(path).then(
      () => true,
      () => false,
    );
  }
}
