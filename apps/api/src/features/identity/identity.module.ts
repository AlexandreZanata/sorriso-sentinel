import { Module } from '@nestjs/common';
import { SESSION_TOKEN_ISSUER } from '../../infrastructure/auth/hmac-session-token.service';
import { HmacSessionTokenService } from '../../infrastructure/auth/hmac-session-token.service';
import { BootstrapSessionController } from './bootstrap-session/bootstrap-session.controller';
import { BootstrapSessionHandler } from './bootstrap-session/bootstrap-session.handler';
import { ChangeIdentityModeController } from './change-identity-mode/change-identity-mode.controller';
import { ChangeIdentityModeHandler } from './change-identity-mode/change-identity-mode.handler';
import { RotateIdentityController } from './rotate-identity/rotate-identity.controller';
import { RotateIdentityHandler } from './rotate-identity/rotate-identity.handler';
import { SessionGuard } from './session/session.guard';

const sessionSecret =
  process.env.SESSION_TOKEN_SECRET ?? 'dev-session-secret-change-me';

@Module({
  controllers: [
    BootstrapSessionController,
    ChangeIdentityModeController,
    RotateIdentityController,
  ],
  providers: [
    BootstrapSessionHandler,
    ChangeIdentityModeHandler,
    RotateIdentityHandler,
    SessionGuard,
    {
      provide: SESSION_TOKEN_ISSUER,
      useValue: new HmacSessionTokenService(sessionSecret),
    },
  ],
  exports: [SessionGuard, SESSION_TOKEN_ISSUER],
})
export class IdentityModule {}
