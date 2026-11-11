import { Injectable } from '@nestjs/common';

@Injectable()
export class CalcService {
  calculate(input: string) {
    const tokens = input.match(/\d+(?:\.\d+)?|[+\-*/()]/g) ?? [];
    if (tokens.join('') !== input.replace(/\s+/g, '')) {
      throw new Error('разрешена только арифметика');
    }
    let i = 0;
    const factor = (): number => {
      const token = tokens[i++];
      if (token === '(') {
        const value = expression();
        if (tokens[i++] !== ')') throw new Error('ожидалась )');
        return value;
      }
      if (token === '-') return -factor();
      if (token === undefined || Number.isNaN(Number(token))) {
        throw new Error(`неожиданно ${token ?? 'конец'}`);
      }
      return Number(token);
    };
    const term = (): number => {
      let value = factor();
      while (tokens[i] === '*' || tokens[i] === '/')
        value = tokens[i++] === '*' ? value * factor() : value / factor();
      return value;
    };
    const expression = (): number => {
      let value = term();
      while (tokens[i] === '+' || tokens[i] === '-')
        value = tokens[i++] === '+' ? value + term() : value - term();
      return value;
    };
    const result = expression();
    if (i !== tokens.length) throw new Error(`неожиданно ${tokens[i]}`);
    return result;
  }
}
