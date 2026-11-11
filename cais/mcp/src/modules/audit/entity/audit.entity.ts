import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('mcp_audit')
export class Audit {
  @PrimaryColumn('int')
  seq: number;

  @Column()
  time: string;

  @Column()
  user: string;

  @Column()
  tool: string;

  @Column('text')
  args: string;

  @Column('text')
  outcome: string;

  @Column()
  prev: string;

  @Column()
  hash: string;
}
