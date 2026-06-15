import type { AuditAction, AuditActorType } from '../value-objects/audit-action.vo.js';

export interface AuditLogAppendInput {
  cityId: string;
  occurrenceId: string;
  action: AuditAction;
  actorType: AuditActorType;
  actorRef?: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  isSensitive: boolean;
}

export interface AuditLogSummary {
  totalEntries: number;
  sensitiveEntries: number;
  lastRecordedAt: string | null;
  actionCounts: Record<string, number>;
}

export interface AuditLogRepositoryPort {
  append(entry: AuditLogAppendInput): Promise<void>;
  getSummary(cityId: string): Promise<AuditLogSummary>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
