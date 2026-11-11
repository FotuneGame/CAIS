import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ebrb_attributes')
export class Attribute {
  @PrimaryColumn()
  name: string;

  @Column('text')
  description: string;

  @Column('float')
  weight: number;

  @Column('jsonb')
  referential: number[];

  @Column({ default: true })
  required: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
