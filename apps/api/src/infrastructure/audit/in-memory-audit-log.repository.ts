import { Injectable } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogAppendInput,
  type AuditLogRepositoryPort,
  type AuditLogSummary,
  sanitizeAuditSnapshot,
} from '@sorriso-sentinel/domain';

interface StoredAuditEntry extends AuditLogAppendInput {
  createdAt: Date;
}

@Injectable()
export class InMemoryAuditLogRepository implements AuditLogRepositoryPort {
  private readonly entries: StoredAuditEntry[] = [];

  async append(entry: AuditLogAppendInput): Promise<void> {
    this.entries.push({
      ...entry,
      beforeState: sanitizeAuditSnapshot(entry.beforeState),
      afterState: sanitizeAuditSnapshot(entry.afterState),
      createdAt: new Date(),
    });
  }

  async getSummary(cityId: string): Promise<AuditLogSummary> {
    const cityEntries = this.entries.filter((entry) => entry.cityId === cityId);
    const actionCounts: Record<string, number> = {};
    let lastRecordedAt: string | null = null;

    for (const entry of cityEntries) {
      actionCounts[entry.action] = (actionCounts[entry.action] ?? 0) + 1;
      const iso = entry.createdAt.toISOString();

      if (!lastRecordedAt || iso > lastRecordedAt) {
        lastRecordedAt = iso;
      }
    }

    return {
      totalEntries: cityEntries.length,
      sensitiveEntries: cityEntries.filter((entry) => entry.isSensitive).length,
      lastRecordedAt,
      actionCounts,
    };
  }
}

export const inMemoryAuditLogRepositoryProvider = {
  provide: AUDIT_LOG_REPOSITORY,
  useClass: InMemoryAuditLogRepository,
};
