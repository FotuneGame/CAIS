import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ebrb_actions')
export class Action {
  @PrimaryColumn()
  name: string;

  @Column('text')
  description: string;

  @Column({ default: true })
  safe: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
