import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { MemoryKind } from '../types/memory.types';

@Entity('coder_memories')
export class Memory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kind: MemoryKind;

  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}
