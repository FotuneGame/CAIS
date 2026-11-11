import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { AgentResult } from '../../agent/types/agent.types';
import type { RunStatus } from '../types/runs.types';

@Entity('coder_runs')
export class Run {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  owner: string;

  @Column('text')
  task: string;

  @Column()
  status: RunStatus;

  @Column('jsonb', { nullable: true })
  result: AgentResult | null;

  @Column('text', { nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
