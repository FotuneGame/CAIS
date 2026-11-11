import type { Audit } from '../entity/audit.entity';

export type AuditEntry = Omit<Audit, 'hash'>;
