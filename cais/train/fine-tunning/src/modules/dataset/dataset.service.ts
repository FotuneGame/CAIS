import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { TrainMode } from '../gguf/types/gguf.types';
import {
  CHAT_EXTENSIONS,
  CHAT_TEMPLATE,
  TEXT_EXTENSIONS,
} from './constants/dataset.constants';
import { ChatMessage, ChatRecord } from './types/dataset.types';

@Injectable()
export class DatasetService {
  async prepare(file: string, mode: TrainMode, workDir: string) {
    const extension = extname(file).toLowerCase();
    if (mode === 'text') {
      if (!TEXT_EXTENSIONS.includes(extension)) {
        throw new BadRequestException(
          `для обучения на тексте нужен ${TEXT_EXTENSIONS.join(' или ')}`,
        );
      }
      return file;
    }
    if (!CHAT_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        'для дообучения нужен .jsonl с messages или prompt/completion',
      );
    }
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/).filter(Boolean);
    const text = lines
      .map((line, i) => this.chat(JSON.parse(line) as ChatRecord, i))
      .join('');
    await mkdir(workDir, { recursive: true });
    const output = join(workDir, 'dataset.txt');
    await writeFile(output, text);
    return output;
  }

  chat(record: ChatRecord, index: number) {
    const messages: ChatMessage[] =
      record.messages ??
      (record.prompt !== undefined && record.completion !== undefined
        ? [
            { role: 'user', content: record.prompt },
            { role: 'assistant', content: record.completion },
          ]
        : []);
    if (!messages.length)
      throw new BadRequestException(
        `строка ${index + 1}: нет messages или prompt/completion`,
      );
    return messages
      .map(
        (m) => `${CHAT_TEMPLATE.start(m.role)}${m.content}${CHAT_TEMPLATE.end}`,
      )
      .join('');
  }
}
