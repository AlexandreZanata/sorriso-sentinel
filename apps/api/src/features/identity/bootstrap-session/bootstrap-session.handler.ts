import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  CONTRIBUTOR_IDENTITY_REPOSITORY,
  ContributorIdentity,
  type ContributorIdentityRepositoryPort,
} from '@sorriso-sentinel/domain';
import { bootstrapSessionSchema } from '@sorriso-sentinel/shared';
import {
  createContributorId,
  SESSION_TOKEN_ISSUER,
  type SessionTokenIssuerPort,
} from '../../../infrastructure/auth/hmac-session-token.service';
import { generateReputationId } from '../../../infrastructure/reputation/reputation-id.generator';
import { REDIS_RATE_LIMITER } from '../../../infrastructure/redis/redis.tokens';
import type { RateLimiterPort } from '../../../infrastructure/redis/rate-limiter.port';

export interface BootstrapSessionResult {
  sessionToken: string;
  reputationId: string;
  contributorId: string;
  identityMode: 'ghost';
}

@Injectable()
export class BootstrapSessionHandler {
  constructor(
    @Inject(CONTRIBUTOR_IDENTITY_REPOSITORY)
    private readonly contributors: ContributorIdentityRepositoryPort,
    @Inject(SESSION_TOKEN_ISSUER)
    private readonly sessionTokens: SessionTokenIssuerPort,
    @Inject(REDIS_RATE_LIMITER)
    private readonly rateLimiter: RateLimiterPort,
  ) {}

  async execute(body: unknown): Promise<BootstrapSessionResult> {
    const parsed = bootstrapSessionSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const rateLimit = await this.rateLimiter.consume(
      `bootstrap:${parsed.data.cityId}:${parsed.data.localKeyRef}`,
      30,
      3600,
    );

    if (!rateLimit.allowed) {
      throw new HttpException({ code: 'RATE_LIMIT_EXCEEDED' }, 429);
    }

    const existing = await this.contributors.findByLocalKeyRef(
      parsed.data.localKeyRef,
      parsed.data.cityId,
    );

    if (existing) {
      return {
        sessionToken: this.sessionTokens.issue(existing),
        reputationId: existing.reputationId,
        contributorId: existing.id,
        identityMode: 'ghost',
      };
    }

    const identity = ContributorIdentity.bootstrap({
      id: createContributorId(),
      cityId: parsed.data.cityId,
      reputationId: generateReputationId(),
      localKeyRef: parsed.data.localKeyRef,
      clock: () => new Date(),
    });

    try {
      await this.contributors.save(identity);
    } catch {
      throw new ConflictException({ code: 'IDENTITY_CONFLICT' });
    }

    return {
      sessionToken: this.sessionTokens.issue(identity),
      reputationId: identity.reputationId,
      contributorId: identity.id,
      identityMode: 'ghost',
    };
  }
}
