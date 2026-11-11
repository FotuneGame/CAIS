import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('train_models')
export class Model {
  @PrimaryColumn()
  name: string;

  @Column()
  trainer: string;

  @Column('text', { nullable: true })
  base: string | null;

  @Column()
  dataset: string;

  @Column('text', { nullable: true })
  file: string | null;

  @Column('text', { nullable: true })
  quantized: string | null;

  @Column('jsonb', { nullable: true })
  metrics: Record<string, number> | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
