import { Injectable } from '@nestjs/common';
import { AttributeData } from '../attributes/types/attributes.types';
import { Extracted } from '../infer/types/infer.types';
import { Raw, Validated } from './types/validation.types';

@Injectable()
export class ValidationService {
  validate(raw: Raw, attributes: AttributeData[]): Validated {
    const extracted: Extracted = {};
    const problems: string[] = [];
    for (const { name, referential, required } of attributes) {
      const item = raw[name];
      if (item?.value === undefined || item.value === null) {
        if (required) problems.push(`${name}: нет значения`);
        continue;
      }
      const value = Number(item.value);
      const confidence =
        item.confidence === undefined ? 1 : Number(item.confidence);
      const min = referential[0];
      const max = referential[referential.length - 1];
      if (!Number.isFinite(value)) problems.push(`${name}: значение не число`);
      else if (value < min || value > max)
        problems.push(`${name}: ${value} вне диапазона ${min}..${max}`);
      else if (
        !Number.isFinite(confidence) ||
        confidence < 0 ||
        confidence > 1
      ) {
        problems.push(`${name}: уверенность вне 0..1`);
      } else extracted[name] = { value, confidence };
    }
    const unknown = Object.keys(raw).filter(
      (name) => !attributes.some((a) => a.name === name),
    );
    problems.push(...unknown.map((name) => `${name}: нет в схеме атрибутов`));
    return { extracted, problems };
  }
}
