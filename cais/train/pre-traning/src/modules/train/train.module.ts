import { Module } from '@nestjs/common';
import { GgufModule } from '../gguf/gguf.module';
import { ModelsModule } from '../models/models.module';
import { TrainService } from './train.service';

@Module({
  imports: [GgufModule, ModelsModule],
  providers: [TrainService],
  exports: [TrainService],
})
export class TrainModule {}
