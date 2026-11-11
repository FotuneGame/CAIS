import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StorageService } from '../../shared/storage/storage.service';
import { ModelsService } from './models.service';

@ApiTags('models')
@ApiBearerAuth()
@Controller()
export class ModelsController {
  constructor(
    private readonly modelsService: ModelsService,
    private readonly storageService: StorageService,
  ) {}

  @Get('datasets')
  async datasets() {
    return {
      datasets: await this.storageService.files(this.storageService.datasetDir),
    };
  }

  @Get('bases')
  async bases() {
    const files = await this.storageService.files(
      this.storageService.modelsDir,
    );
    return {
      bases: files.filter(
        (f) => f.endsWith('.gguf') && !f.startsWith('.work/'),
      ),
    };
  }

  @Get('models')
  async list() {
    return { models: await this.modelsService.list() };
  }
}
