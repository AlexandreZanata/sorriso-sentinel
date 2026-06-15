import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { AdminController } from './admin.controller';
import { AuditSummaryHandler } from './audit-summary/audit-summary.handler';
import { ModerationQueueHandler } from './moderation-queue/moderation-queue.handler';

@Module({
  imports: [IdentityModule, AuthModule],
  controllers: [AdminController],
  providers: [AuditSummaryHandler, ModerationQueueHandler],
})
export class AdminModule {}
