import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  SESSION_TOKEN_ISSUER,
  type SessionClaims,
  type SessionTokenIssuerPort,
} from '../../../infrastructure/auth/hmac-session-token.service';

export const SESSION_CLAIMS = Symbol('SESSION_CLAIMS');

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(SESSION_TOKEN_ISSUER)
    private readonly sessionTokens: SessionTokenIssuerPort,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      session?: SessionClaims;
    }>();

    const authorization = request.headers.authorization;
    const headerValue = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (!headerValue?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const token = headerValue.slice('Bearer '.length);
    const claims = this.sessionTokens.verify(token);

    if (!claims) {
      throw new UnauthorizedException({ code: 'INVALID_SESSION' });
    }

    request.session = claims;
    return true;
  }
}
