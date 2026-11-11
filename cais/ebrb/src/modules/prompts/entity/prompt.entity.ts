import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('agent_prompts')
export class Prompt {
  @PrimaryColumn()
  agent: string;

  @PrimaryColumn()
  name: string;

  @Column('text')
  text: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
