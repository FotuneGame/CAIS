import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from './entity/attribute.entity';
import { AttributeData } from './types/attributes.types';

@Injectable()
export class AttributesService implements OnModuleInit {
  private cache: AttributeData[] = [];

  constructor(
    @InjectRepository(Attribute)
    private readonly attributes: Repository<Attribute>,
  ) {}

  onModuleInit() {
    return this.reload();
  }

  current() {
    return this.cache;
  }

  async reload() {
    const rows = await this.attributes.find({ order: { name: 'ASC' } });
    this.cache = rows.map(
      ({ name, description, weight, referential, required }) => ({
        name,
        description,
        weight,
        required,
        referential: [...referential].sort((a, b) => a - b),
      }),
    );
    return this.cache;
  }

  async save(attributes: AttributeData[]) {
    for (const { name, referential } of attributes) {
      const sorted = [...referential].sort((a, b) => a - b);
      if (sorted.some((point, j) => j > 0 && point === sorted[j - 1]))
        throw new BadRequestException(
          `${name}: референтные значения повторяются`,
        );
    }
    await this.attributes.save(attributes);
    return this.reload();
  }

  async remove(name: string) {
    const { affected } = await this.attributes.delete({ name });
    if (!affected) throw new NotFoundException(`нет атрибута ${name}`);
    return this.reload();
  }
}
