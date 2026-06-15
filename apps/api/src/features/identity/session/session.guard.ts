import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ACCESS_TOKEN_ISSUER,
  type AccessTokenIssuerPort,
} from '../../../infrastructure/auth/jwt-access-token.service';
import {
  SESSION_TOKEN_ISSUER,
  type SessionClaims,
  type SessionTokenIssuerPort,
} from '../../../infrastructure/auth/hmac-session-token.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(SESSION_TOKEN_ISSUER)
    private readonly sessionTokens: SessionTokenIssuerPort,
    @Inject(ACCESS_TOKEN_ISSUER)
    private readonly accessTokens: AccessTokenIssuerPort,
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
    const jwtClaims = this.accessTokens.verify(token);

    if (jwtClaims) {
      request.session = {
        contributorId: jwtClaims.contributorId,
        cityId: jwtClaims.cityId,
        reputationId: jwtClaims.reputationId,
        identityMode: jwtClaims.identityMode,
        pseudonym: jwtClaims.pseudonym,
        userAccountId: jwtClaims.userAccountId,
        roles: jwtClaims.roles,
      };
      return true;
    }

    const sessionClaims = this.sessionTokens.verify(token);

    if (!sessionClaims) {
      throw new UnauthorizedException({ code: 'INVALID_SESSION' });
    }

    request.session = sessionClaims;
    return true;
  }
}
