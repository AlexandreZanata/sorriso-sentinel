import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { ContributorIdentity } from '@sorriso-sentinel/domain';

export interface SessionClaims {
  contributorId: string;
  cityId: string;
  reputationId: string;
  identityMode: 'ghost' | 'pseudonym' | 'public';
  pseudonym: string | null;
  userAccountId?: string;
  roles?: string[];
}

export interface SessionTokenIssuerPort {
  issue(identity: ContributorIdentity): string;
  verify(token: string): SessionClaims | null;
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export class HmacSessionTokenService implements SessionTokenIssuerPort {
  constructor(private readonly secret: string) {}

  issue(identity: ContributorIdentity): string {
    const payload = {
      contributorId: identity.id,
      cityId: identity.cityId,
      reputationId: identity.reputationId,
      identityMode: identity.identityMode,
      pseudonym: identity.pseudonym,
      exp: Date.now() + TOKEN_TTL_MS,
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = createHmac('sha256', this.secret)
      .update(encodedPayload)
      .digest('base64url');

    return `${encodedPayload}.${signature}`;
  }

  verify(token: string): SessionClaims | null {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = createHmac('sha256', this.secret)
      .update(encodedPayload)
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
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as SessionClaims & { exp: number };

      if (typeof payload.exp !== 'number' || payload.exp < Date.now()) {
        return null;
      }

      return {
        contributorId: payload.contributorId,
        cityId: payload.cityId,
        reputationId: payload.reputationId,
        identityMode: payload.identityMode,
        pseudonym: payload.pseudonym,
      };
    } catch {
      return null;
    }
  }
}

export function createContributorId(): string {
  return randomUUID();
}

export const SESSION_TOKEN_ISSUER = Symbol('SESSION_TOKEN_ISSUER');
