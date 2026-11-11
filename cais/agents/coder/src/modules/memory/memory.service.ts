import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Memory } from './entity/memory.entity';
import { MemoryKind } from './types/memory.types';

@Injectable()
export class MemoryService {
  constructor(
    @InjectRepository(Memory) private readonly memories: Repository<Memory>,
  ) {}

  async recall(task: string, limit = 3) {
    const words = new Set(task.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []);
    if (!words.size) return [];
    const rows = await this.memories.find({
      where: [...words]
        .slice(0, 20)
        .map((word) => ({ text: ILike(`%${word}%`) })),
      order: { kind: 'ASC', createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((row) => `${row.kind}: ${row.text}`);
  }

  rememberTask(task: string, answer: string | null) {
    return this.add('task', `${task} -> ${answer ?? 'не завершено'}`);
  }

  rememberLesson(task: string, note: string) {
    return this.add('lesson', `${task} — ${note}`);
  }

  private async add(kind: MemoryKind, text: string) {
    await this.memories.save({ kind, text });
  }
}
