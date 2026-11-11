import { Injectable } from '@nestjs/common';
import { CHUNK_SIZE } from './constants/chunk.constants';

@Injectable()
export class ChunkService {
  split(text: string, size = CHUNK_SIZE) {
    const parts: string[] = [];
    let current = '';
    for (const paragraph of text.split(/\n\s*\n/)) {
      if (current && current.length + paragraph.length > size) {
        parts.push(current.trim());
        current = '';
      }
      current += `${paragraph}\n\n`;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }
}
