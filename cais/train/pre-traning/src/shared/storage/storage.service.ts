import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  get datasetDir() {
    return `${this.root}/dataset`;
  }

  get modelsDir() {
    return `${this.root}/models`;
  }

  inside(dir: string, name: string) {
    const full = resolve(dir, name);
    if (!full.startsWith(resolve(dir) + sep)) {
      throw new BadRequestException(`путь вне папки: ${name}`);
    }
    return full;
  }

  async files(dir: string) {
    await mkdir(dir, { recursive: true });
    const entries = await readdir(dir, {
      recursive: true,
      withFileTypes: true,
    });
    return entries
      .filter((e) => e.isFile() && e.name !== '.gitkeep')
      .map((e) =>
        `${e.parentPath}/${e.name}`.slice(dir.length + 1).replaceAll('\\', '/'),
      );
  }

  private get root() {
    return this.configService.get<string>('app.appDataPath', './app-data');
  }
}
