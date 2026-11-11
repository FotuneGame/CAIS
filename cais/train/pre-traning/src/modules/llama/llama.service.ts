import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { LlamaConfig } from '../../config/llama.config';
import { Log } from '../gguf/types/gguf.types';
import { FinetuneOptions } from './types/llama.types';

@Injectable()
export class LlamaService {
  private readonly config: LlamaConfig;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<LlamaConfig>('llama');
  }

  finetune(options: FinetuneOptions, cwd: string, log: Log) {
    const values: Record<string, string | number> = {
      ...options,
      gpuLayers: this.config.gpuLayers,
      threads: this.config.threads,
    };
    const args = this.config.finetuneArgs
      .split(/\s+/)
      .filter(Boolean)
      .map((arg) =>
        arg.replace(/\{(\w+)\}/g, (_, key: string) =>
          String(values[key] ?? ''),
        ),
      );
    return this.run('llama-finetune', args, cwd, log);
  }

  quantize(input: string, output: string, type: string, log: Log) {
    return this.run(
      'llama-quantize',
      [input, output, type],
      dirname(output),
      log,
    );
  }

  async perplexity(model: string, data: string, context: number, log: Log) {
    const text = await this.run(
      'llama-perplexity',
      [
        '-m',
        model,
        '-f',
        data,
        '-c',
        String(context),
        '-t',
        this.config.threads,
      ],
      dirname(model),
      log,
    );
    const values = [...text.matchAll(/PPL = ([\d.]+)/g)].map((m) =>
      Number(m[1]),
    );
    return values.at(-1) ?? NaN;
  }

  run(binary: string, args: string[], cwd: string, log: Log): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(`${this.config.binDir}/${binary}`, args, {
        cwd,
        env: { ...process.env, LD_LIBRARY_PATH: this.config.binDir },
      });
      let tail = '';
      const collect = (chunk: Buffer) => {
        const text = chunk.toString();
        tail = (tail + text).slice(-20000);
        for (const line of text.split('\n')) {
          if (/epoch|loss|PPL|quantiz|error/i.test(line))
            log({ [binary]: line.trim() });
        }
      };
      child.stdout.on('data', collect);
      child.stderr.on('data', collect);
      child.on('error', reject);
      child.on('close', (code) =>
        code === 0
          ? resolve(tail)
          : reject(new Error(`${binary}: код ${code}\n${tail.slice(-500)}`)),
      );
    });
  }
}
