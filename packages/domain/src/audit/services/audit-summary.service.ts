import type {
  AuditLogRepositoryPort,
  AuditLogSummary,
} from '../ports/audit-log.repository.port.js';

export class AuditSummaryService {
  constructor(private readonly auditLog: AuditLogRepositoryPort) {}

  async buildSummary(cityId: string): Promise<AuditLogSummary> {
    return this.auditLog.getSummary(cityId);
  }
}
