import { Injectable } from '@nestjs/common';
import { CalcService } from '../calc/calc.service';
import { Tool } from './types/tools.types';

@Injectable()
export class ToolsService {
  private readonly tools: Record<string, Tool>;

  constructor(calcService: CalcService) {
    this.tools = {
      time: {
        description: 'текущие дата и время, input не нужен',
        run: () => new Date().toISOString(),
      },
      calc: {
        description:
          'арифметическое выражение из чисел и + - * / ( ), например "2*(3+4)"',
        run: (input) => String(calcService.calculate(input)),
      },
    };
  }

  has(name: string) {
    return Object.hasOwn(this.tools, name);
  }

  describe() {
    return Object.entries(this.tools)
      .map(([name, tool]) => `- ${name}: ${tool.description}`)
      .join('\n');
  }

  run(name: string, input: string) {
    try {
      return this.tools[name].run(input);
    } catch (error) {
      return `ошибка: ${(error as Error).message}`;
    }
  }
}
