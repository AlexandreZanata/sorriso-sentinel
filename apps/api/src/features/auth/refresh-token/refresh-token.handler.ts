import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CONTRIBUTOR_IDENTITY_REPOSITORY,
  USER_ACCOUNT_REPOSITORY,
  type ContributorIdentityRepositoryPort,
  type UserAccountRepositoryPort,
} from '@sorriso-sentinel/domain';
import {
  loadAuthConfigFromEnv,
  refreshTokenSchema,
  type AuthRole,
} from '@sorriso-sentinel/shared';
import { randomUUID } from 'node:crypto';
import {
  ACCESS_TOKEN_ISSUER,
  createRefreshToken,
  hashRefreshToken,
  type AccessTokenIssuerPort,
} from '../../../infrastructure/auth/jwt-access-token.service';
import {
  REFRESH_TOKEN_STORE,
  type RefreshTokenStorePort,
} from '../../../infrastructure/auth/refresh-token.store.port';

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  tokenType: 'Bearer';
}

@Injectable()
export class RefreshTokenHandler {
  constructor(
    @Inject(REFRESH_TOKEN_STORE)
    private readonly refreshTokens: RefreshTokenStorePort,
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly accounts: UserAccountRepositoryPort,
    @Inject(CONTRIBUTOR_IDENTITY_REPOSITORY)
    private readonly contributors: ContributorIdentityRepositoryPort,
    @Inject(ACCESS_TOKEN_ISSUER)
    private readonly accessTokens: AccessTokenIssuerPort,
  ) {}

  async execute(body: unknown): Promise<RefreshTokenResponse> {
    const parsed = refreshTokenSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const stored = await this.refreshTokens.findByTokenHash(
      hashRefreshToken(parsed.data.refreshToken),
    );

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }

    const account = await this.accounts.findById(
      stored.cityId,
      stored.userAccountId,
    );

    if (!account || account.status !== 'active') {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }

    const contributor = await this.contributors.findById(
      account.contributorId,
      stored.cityId,
    );

    if (!contributor) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }

    const revokedAt = new Date();
    await this.refreshTokens.revokeByTokenHash(stored.tokenHash, revokedAt);

    const roles = (await this.accounts.listRoles(
      stored.cityId,
      account.id,
    )) as AuthRole[];
    const authConfig = loadAuthConfigFromEnv();
    const accessToken = this.accessTokens.issue({
      contributorId: contributor.id,
      cityId: contributor.cityId,
      reputationId: contributor.reputationId,
      identityMode: contributor.identityMode,
      pseudonym: contributor.pseudonym,
      userAccountId: account.id,
      roles,
    });

    const refreshToken = createRefreshToken();
    const expiresAt = new Date(
      Date.now() + authConfig.refreshTokenTtlSeconds * 1000,
    );

    await this.refreshTokens.save({
      id: randomUUID(),
      cityId: stored.cityId,
      userAccountId: stored.userAccountId,
      tokenHash: hashRefreshToken(refreshToken),
      familyId: stored.familyId,
      expiresAt,
      revokedAt: null,
    });

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: authConfig.accessTokenTtlSeconds,
      tokenType: 'Bearer',
    };
  }
}
