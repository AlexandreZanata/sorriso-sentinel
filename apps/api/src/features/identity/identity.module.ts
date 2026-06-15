import { Module } from '@nestjs/common';
import { SESSION_TOKEN_ISSUER } from '../../infrastructure/auth/hmac-session-token.service';
import { HmacSessionTokenService } from '../../infrastructure/auth/hmac-session-token.service';
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
      provide: SESSION_TOKEN_ISSUER,
      useValue: new HmacSessionTokenService(sessionSecret),
    },
  ],
  exports: [SessionGuard, SESSION_TOKEN_ISSUER],
})
export class IdentityModule {}
