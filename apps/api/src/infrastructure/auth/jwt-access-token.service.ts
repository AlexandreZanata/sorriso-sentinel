import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { loadAuthConfigFromEnv } from '@sorriso-sentinel/shared';
import type { AuthRole } from '@sorriso-sentinel/shared';

export interface AccessTokenClaims {
  contributorId: string;
  cityId: string;
  reputationId: string;
  identityMode: 'ghost' | 'pseudonym' | 'public';
  pseudonym: string | null;
  userAccountId: string;
  roles: AuthRole[];
}

export interface AccessTokenIssuerPort {
  issue(claims: AccessTokenClaims): string;
  verify(token: string): AccessTokenClaims | null;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

export class JwtAccessTokenService implements AccessTokenIssuerPort {
  private readonly config = loadAuthConfigFromEnv();

  issue(claims: AccessTokenClaims): string {
    const header = base64UrlEncode(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    );
    const now = Math.floor(Date.now() / 1000);
    const payload = base64UrlEncode(
      JSON.stringify({
        sub: claims.contributorId,
        city_id: claims.cityId,
        reputation_id: claims.reputationId,
        identity_mode: claims.identityMode,
        pseudonym: claims.pseudonym,
        user_account_id: claims.userAccountId,
        roles: claims.roles,
        typ: 'access',
        iss: this.config.jwtIssuer,
        aud: this.config.jwtAudience,
        iat: now,
        exp: now + this.config.accessTokenTtlSeconds,
      }),
    );
    const signature = createHmac('sha256', this.config.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  verify(token: string): AccessTokenClaims | null {
    const [header, payload, signature] = token.split('.');

    if (!header || !payload || !signature) {
      return null;
    }

    const expectedSignature = createHmac('sha256', this.config.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    try {
      const decodedHeader = JSON.parse(
        base64UrlDecode(header).toString('utf8'),
      ) as { alg?: string; typ?: string };

      if (decodedHeader.alg !== 'HS256' || decodedHeader.typ !== 'JWT') {
        return null;
      }

      const decodedPayload = JSON.parse(
        base64UrlDecode(payload).toString('utf8'),
      ) as {
        sub: string;
        city_id: string;
        reputation_id: string;
        identity_mode: AccessTokenClaims['identityMode'];
        pseudonym: string | null;
        user_account_id: string;
        roles?: AuthRole[];
        typ?: string;
        iss?: string;
        aud?: string;
        exp?: number;
      };

      if (
        decodedPayload.typ !== 'access' ||
        decodedPayload.iss !== this.config.jwtIssuer ||
        decodedPayload.aud !== this.config.jwtAudience ||
        typeof decodedPayload.exp !== 'number' ||
        decodedPayload.exp < Math.floor(Date.now() / 1000)
      ) {
        return null;
      }

      return {
        contributorId: decodedPayload.sub,
        cityId: decodedPayload.city_id,
        reputationId: decodedPayload.reputation_id,
        identityMode: decodedPayload.identity_mode,
        pseudonym: decodedPayload.pseudonym,
        userAccountId: decodedPayload.user_account_id,
        roles: decodedPayload.roles ?? [],
      };
    } catch {
      return null;
    }
  }
}

export function createRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const ACCESS_TOKEN_ISSUER = Symbol('ACCESS_TOKEN_ISSUER');
