import { registerAs } from '@nestjs/config';

export interface LlamaConfig {
  binDir: string;
  finetuneArgs: string;
  gpuLayers: string;
  threads: string;
}

export default registerAs('llama', (): LlamaConfig => ({
  binDir: process.env.LLAMA_BIN_DIR || '/app',
  finetuneArgs:
    process.env.LLAMA_FINETUNE_ARGS ||
    '-m {model} -f {data} -o {output} -c {context} -b {batch} -ub {batch} -epochs {epochs} -lr {lr} -ngl {gpuLayers} -t {threads}',
  gpuLayers: process.env.LLAMA_GPU_LAYERS || '0',
  threads: process.env.LLAMA_THREADS || '2',
}));
