import { Fact } from '../src/modules/facts/types/facts.types';

export const base = {
  attributes: [
    {
      name: 'risk',
      description: 'риск действия',
      weight: 1,
      referential: [0, 0.5, 1],
      required: true,
    },
  ],
  actions: [
    { name: 'read', description: 'чтение файла', safe: true },
    { name: 'shell', description: 'команда оболочки', safe: false },
  ],
  rules: [
    { id: 'safe', antecedents: { risk: 0 }, consequent: { ALLOW: 1 } },
    { id: 'danger', antecedents: { risk: 1 }, consequent: { BLOCK: 1 } },
  ],
};

export class FakeStore {
  items: Fact[] = [];
  replace = async (title: string, facts: Fact[]) => {
    this.items = [...this.items.filter((f) => f.title !== title), ...facts];
  };
  search = async (query: string) =>
    this.items
      .filter((f) => !f.injection && f.text.includes(query))
      .map((f) => ({ ...f, score: 1 }));
  review = async (title: string) =>
    this.items.filter((f) => f.title === title).length;
  list = async () => [];
}
