import type { Model } from '../entity/model.entity';

export type ModelInfo = Omit<Model, 'updatedAt'>;
