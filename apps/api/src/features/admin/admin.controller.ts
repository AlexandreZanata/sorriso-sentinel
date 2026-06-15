import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { SessionClaims } from '../../infrastructure/auth/hmac-session-token.service';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { SessionGuard } from '../identity/session/session.guard';
import { AuditSummaryHandler } from './audit-summary/audit-summary.handler';
import { ModerationQueueHandler } from './moderation-queue/moderation-queue.handler';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly auditSummary: AuditSummaryHandler,
    private readonly moderationQueue: ModerationQueueHandler,
  ) {}

  @Get('audit-summary')
  @UseGuards(SessionGuard, TenantGuard, RolesGuard)
  @Roles('security_audit', 'city_admin')
  auditSummaryRoute(@Req() request: Request & { session?: SessionClaims }) {
    return this.auditSummary.execute(request.session);
  }

  @Get('moderation-queue')
  @UseGuards(SessionGuard, TenantGuard, RolesGuard)
  @Roles('moderator', 'city_admin')
  moderationQueueRoute(@Req() request: Request & { session?: SessionClaims }) {
    return this.moderationQueue.execute(request.session);
  }
}
