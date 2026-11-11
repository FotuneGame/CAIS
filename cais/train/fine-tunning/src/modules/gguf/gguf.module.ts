import { Module } from '@nestjs/common';
import { LlamaModule } from '../llama/llama.module';
import { DatasetModule } from '../dataset/dataset.module';
import { GgufService } from './gguf.service';

@Module({
  imports: [LlamaModule, DatasetModule],
  providers: [GgufService],
  exports: [GgufService],
})
export class GgufModule {}
