import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  AuditSummaryService,
  type AuditLogRepositoryPort,
} from '@sorriso-sentinel/domain';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';

export interface AuditSummaryResponse {
  status: 'ok';
  cityId: string;
  totalEntries: number;
  sensitiveEntries: number;
  lastRecordedAt: string | null;
  actionCounts: Record<string, number>;
}

@Injectable()
export class AuditSummaryHandler {
  private readonly summaryService: AuditSummaryService;

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    auditLog: AuditLogRepositoryPort,
  ) {
    this.summaryService = new AuditSummaryService(auditLog);
  }

  async execute(session: SessionClaims | undefined): Promise<AuditSummaryResponse> {
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const summary = await this.summaryService.buildSummary(session.cityId);

    return {
      status: 'ok',
      cityId: session.cityId,
      totalEntries: summary.totalEntries,
      sensitiveEntries: summary.sensitiveEntries,
      lastRecordedAt: summary.lastRecordedAt,
      actionCounts: summary.actionCounts,
    };
  }
}
