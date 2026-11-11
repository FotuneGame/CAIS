import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { RuleSource } from '../types/rules.types';

@Entity('ebrb_rules')
export class Rule {
  @PrimaryColumn()
  id: string;

  @Column('jsonb')
  antecedents: Record<string, number>;

  @Column('jsonb')
  consequent: Record<string, number>;

  @Column('float')
  weight: number;

  @Column('float')
  reliability: number;

  @Column()
  source: RuleSource;

  @Column({ default: false })
  reviewed: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
