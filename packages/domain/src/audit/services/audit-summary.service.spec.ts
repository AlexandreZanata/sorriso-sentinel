import { describe, expect, it, vi } from 'vitest';
import type { AuditLogRepositoryPort } from '../ports/audit-log.repository.port.js';
import { AuditSummaryService } from './audit-summary.service.js';

describe('AuditSummaryService', () => {
  it('should_build_summary_from_repository', async () => {
    const auditLog: AuditLogRepositoryPort = {
      append: vi.fn(),
      getSummary: vi.fn().mockResolvedValue({
        totalEntries: 3,
        sensitiveEntries: 1,
        lastRecordedAt: '2026-06-15T12:00:00.000Z',
        actionCounts: { occurrence_created: 3 },
      }),
    };

    const service = new AuditSummaryService(auditLog);
    const summary = await service.buildSummary(
      '01932f1a-0000-7000-8000-000000000001',
    );

    expect(summary.totalEntries).toBe(3);
    expect(summary.sensitiveEntries).toBe(1);
    expect(auditLog.getSummary).toHaveBeenCalledWith(
      '01932f1a-0000-7000-8000-000000000001',
    );
  });
});
