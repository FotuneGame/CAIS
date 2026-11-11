import { FindOperator } from 'typeorm';

type Row = Record<string, unknown>;
type Where = Row | Row[] | undefined;
type FindOptions = {
  where?: Where;
  order?: Record<string, 'ASC' | 'DESC'>;
  take?: number;
};

const same = (actual: unknown, expected: unknown) => {
  if (!(expected instanceof FindOperator)) return actual === expected;
  const pattern = String(expected.value).replaceAll('%', '').toLowerCase();
  return String(actual).toLowerCase().includes(pattern);
};

const matches = (row: Row, where: Where): boolean => {
  if (!where) return true;
  if (Array.isArray(where)) return where.some((item) => matches(row, item));
  return Object.entries(where).every(([key, value]) => same(row[key], value));
};

export class FakeRepository<T extends object> {
  rows: T[] = [];

  constructor(private readonly keys: string[] = ['id']) {}

  async save<V extends Partial<T> | Partial<T>[]>(value: V): Promise<V> {
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      const index = this.rows.findIndex((row) =>
        this.keys.every((key) => (row as Row)[key] === (item as Row)[key]),
      );
      const stamp = { createdAt: new Date(Date.now() + this.rows.length) };
      if (index >= 0) Object.assign(this.rows[index], item);
      else this.rows.push({ id: this.rows.length + 1, ...stamp, ...item } as T);
    }
    return value;
  }

  async insert(item: Partial<T>) {
    const exists = this.rows.some((row) =>
      this.keys.every((key) => (row as Row)[key] === (item as Row)[key]),
    );
    if (exists) throw new Error('запись уже есть');
    await this.save(item);
    return { identifiers: [] };
  }

  async update(where: Row, patch: Partial<T>) {
    this.rows
      .filter((row) => matches(row as Row, where))
      .forEach((row) => Object.assign(row, patch));
    return { affected: 1 };
  }

  async delete(where: Row) {
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => !matches(row as Row, where));
    return { affected: before - this.rows.length };
  }

  async findOneBy(where: Row) {
    return this.rows.find((row) => matches(row as Row, where)) ?? null;
  }

  async findBy(where: Where) {
    return this.rows.filter((row) => matches(row as Row, where));
  }

  async find({ where, order = {}, take }: FindOptions = {}) {
    const rows = await this.findBy(where);
    for (const [key, direction] of Object.entries(order).reverse()) {
      const sign = direction === 'DESC' ? -1 : 1;
      rows.sort((a, b) => ((a as Row)[key]! > (b as Row)[key]! ? sign : -sign));
    }
    return rows.slice(0, take);
  }
}
