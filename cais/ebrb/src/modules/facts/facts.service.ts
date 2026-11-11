import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { InjectionService } from '../../shared/injection/injection.service';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { StoreService } from '../store/store.service';
import { ChunkService } from '../chunk/chunk.service';
import { TEXT_FILES } from './constants/facts.constants';

@Injectable()
export class FactsService {
  constructor(
    private readonly storeService: StoreService,
    private readonly chunkService: ChunkService,
    private readonly injectionService: InjectionService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  async add(title: string, text: string) {
    const findings = this.injectionService.findings(`${title}\n${text}`);
    const prefix = createHash('sha256')
      .update(title)
      .digest('hex')
      .slice(0, 16);
    const facts = this.chunkService.split(text).map((part, index) => ({
      id: `${prefix}-${index}`,
      title,
      text: part,
      injection:
        findings.length > 0 || this.injectionService.findings(part).length > 0,
      reviewed: false,
    }));
    await this.storeService.replace(title, facts);
    this.kafkaService.publish({
      type: 'fact',
      title,
      chunks: facts.length,
      findings,
    });
    return {
      title,
      chunks: facts.length,
      reviewed: false,
      injection: findings,
    };
  }

  async search(query: string, limit = 5, reviewedOnly = false) {
    const hits = await this.storeService.search(query, limit, reviewedOnly);
    this.kafkaService.publish({ type: 'search', hits: hits.length });
    return { hits };
  }

  async review(title: string) {
    const updated = await this.storeService.review(title);
    if (!updated) throw new NotFoundException(`нет фактов ${title}`);
    return { title, chunks: updated, reviewed: true };
  }

  async list() {
    return { facts: await this.storeService.list() };
  }

  async importFiles() {
    const dataPath = this.configService.get<string>(
      'app.appDataPath',
      './app-data',
    );
    const root = `${dataPath}/facts`;
    await mkdir(root, { recursive: true });
    const entries = await readdir(root, {
      recursive: true,
      withFileTypes: true,
    });
    const files = entries.filter(
      (e) => e.isFile() && TEXT_FILES.has(extname(e.name)),
    );
    let blocked = 0;
    for (const entry of files) {
      const path = join(entry.parentPath, entry.name);
      const added = await this.add(
        relative(root, path),
        await readFile(path, 'utf8'),
      );
      if (added.injection.length) blocked++;
    }
    return { documents: files.length, blocked, reviewed: false };
  }
}
