import { Injectable } from '@nestjs/common';
import { PATTERNS } from './constants/patterns.constants';

@Injectable()
export class InjectionService {
  findings(text: string): string[] {
    const found = PATTERNS.filter(([, p]) => p.test(text)).map(
      ([name]) => name,
    );
    return [...new Set(found)];
  }

  asData(text: string, limit = 4000): string {
    const clean = text.replace(/<\/?data>/gi, '').slice(0, limit);
    return `<data>\n${clean}\n</data>`;
  }
}
