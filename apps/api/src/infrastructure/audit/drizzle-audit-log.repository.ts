import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogAppendInput,
  type AuditLogRepositoryPort,
  type AuditLogSummary,
  sanitizeAuditSnapshot,
} from '@sorriso-sentinel/domain';
import { occurrenceAudit, withCityContext } from '@sorriso-sentinel/database';
import { count, eq, sql } from 'drizzle-orm';
import type pg from 'pg';
import { DATABASE_POOL } from '../database/database.tokens';

@Injectable()
export class DrizzleAuditLogRepository implements AuditLogRepositoryPort {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async append(entry: AuditLogAppendInput): Promise<void> {
    await withCityContext(this.pool, entry.cityId, async (db) => {
      await db.insert(occurrenceAudit).values({
        cityId: entry.cityId,
        occurrenceId: entry.occurrenceId,
        action: entry.action,
        actorType: entry.actorType,
        actorRef: entry.actorRef,
        beforeState: sanitizeAuditSnapshot(entry.beforeState),
        afterState: sanitizeAuditSnapshot(entry.afterState),
        isSensitive: entry.isSensitive,
      });
    });
  }

  async getSummary(cityId: string): Promise<AuditLogSummary> {
    return withCityContext(this.pool, cityId, async (db) => {
      const totalRows = await db
        .select({ totalEntries: count() })
        .from(occurrenceAudit);
      const sensitiveRows = await db
        .select({ sensitiveEntries: count() })
        .from(occurrenceAudit)
        .where(eq(occurrenceAudit.isSensitive, true));
      const lastRows = await db
        .select({ lastRecordedAt: sql<Date | null>`max(${occurrenceAudit.createdAt})` })
        .from(occurrenceAudit);
      const actionRows = await db
        .select({
          action: occurrenceAudit.action,
          count: count(),
        })
        .from(occurrenceAudit)
        .groupBy(occurrenceAudit.action);

      const actionCounts: Record<string, number> = {};

      for (const actionRow of actionRows) {
        actionCounts[actionRow.action] = Number(actionRow.count);
      }

      const lastRecordedAtValue = lastRows[0]?.lastRecordedAt;

      return {
        totalEntries: Number(totalRows[0]?.totalEntries ?? 0),
        sensitiveEntries: Number(sensitiveRows[0]?.sensitiveEntries ?? 0),
        lastRecordedAt: lastRecordedAtValue
          ? new Date(lastRecordedAtValue).toISOString()
          : null,
        actionCounts,
      };
    });
  }
}

export const auditLogRepositoryProvider = {
  provide: AUDIT_LOG_REPOSITORY,
  useClass: DrizzleAuditLogRepository,
};
