import { Module } from '@nestjs/common';
import { CONTRIBUTOR_IDENTITY_REPOSITORY } from '@sorriso-sentinel/domain';
import {
  HmacSessionTokenService,
  SESSION_TOKEN_ISSUER,
} from '../../infrastructure/auth/hmac-session-token.service';
import { InMemoryContributorIdentityRepository } from '../../infrastructure/identity/in-memory-contributor-identity.repository';
import { BootstrapSessionController } from './bootstrap-session/bootstrap-session.controller';
import { BootstrapSessionHandler } from './bootstrap-session/bootstrap-session.handler';
import { SessionGuard } from './session/session.guard';

const sessionSecret =
  process.env.SESSION_TOKEN_SECRET ?? 'dev-session-secret-change-me';

@Module({
  controllers: [BootstrapSessionController],
  providers: [
    BootstrapSessionHandler,
    SessionGuard,
    {
      provide: CONTRIBUTOR_IDENTITY_REPOSITORY,
      useClass: InMemoryContributorIdentityRepository,
    },
    {
      provide: SESSION_TOKEN_ISSUER,
      useValue: new HmacSessionTokenService(sessionSecret),
    },
  ],
  exports: [SessionGuard, SESSION_TOKEN_ISSUER, CONTRIBUTOR_IDENTITY_REPOSITORY],
})
export class IdentityModule {}
