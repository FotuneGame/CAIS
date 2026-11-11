import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { Audit } from './entity/audit.entity';
import { AuditEntry } from './types/audit.types';

@Injectable()
export class AuditService {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    @InjectRepository(Audit) private readonly audit: Repository<Audit>,
  ) {}

  digest(e: AuditEntry) {
    const fields = [e.seq, e.time, e.user, e.tool, e.args, e.outcome, e.prev];
    return createHash('sha256').update(JSON.stringify(fields)).digest('hex');
  }

  record(user: string, tool: string, args: unknown, outcome: string) {
    const next = this.queue.then(async () => {
      const [last] = await this.audit.find({ order: { seq: 'DESC' }, take: 1 });
      const entry: AuditEntry = {
        seq: (last?.seq ?? 0) + 1,
        time: new Date().toISOString(),
        user,
        tool,
        args: JSON.stringify(args ?? {}),
        outcome: outcome.slice(0, 500),
        prev: last?.hash ?? '',
      };
      await this.audit.insert({ ...entry, hash: this.digest(entry) });
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  async verify() {
    const records = await this.audit.find({ order: { seq: 'ASC' } });
    let prev = '';
    for (const [index, record] of records.entries()) {
      const intact =
        record.seq === index + 1 &&
        record.prev === prev &&
        this.digest(record) === record.hash;
      if (!intact)
        return { records: records.length, valid: false, brokenAt: record.seq };
      prev = record.hash;
    }
    return { records: records.length, valid: true };
  }
}
