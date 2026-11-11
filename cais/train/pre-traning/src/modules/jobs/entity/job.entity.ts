import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { JobStatus } from '../types/jobs.types';

@Entity('train_jobs')
export class Job {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  service: string;

  @Column()
  owner: string;

  @Column()
  trainer: string;

  @Column('text', { nullable: true })
  base: string | null;

  @Column()
  dataset: string;

  @Column()
  model: string;

  @Column()
  status: JobStatus;

  @Column('jsonb', { default: [] })
  progress: object[];

  @Column('jsonb', { nullable: true })
  metrics: Record<string, number> | null;

  @Column('text', { nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
