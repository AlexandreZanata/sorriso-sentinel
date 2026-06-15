import {
  BadRequestException,
  ForbiddenException,
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
import { loginSchema, loadAuthConfigFromEnv, type AuthRole } from '@sorriso-sentinel/shared';
import { randomUUID } from 'node:crypto';
import {
  ACCESS_TOKEN_ISSUER,
  createRefreshToken,
  hashRefreshToken,
  type AccessTokenIssuerPort,
} from '../../../infrastructure/auth/jwt-access-token.service';
import {
  PASSWORD_HASHER,
  type PasswordHasherPort,
} from '../../../infrastructure/auth/bcrypt-password-hasher.service';
import {
  REFRESH_TOKEN_STORE,
  type RefreshTokenStorePort,
} from '../../../infrastructure/auth/refresh-token.store.port';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  tokenType: 'Bearer';
}

@Injectable()
export class LoginHandler {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly accounts: UserAccountRepositoryPort,
    @Inject(CONTRIBUTOR_IDENTITY_REPOSITORY)
    private readonly contributors: ContributorIdentityRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(ACCESS_TOKEN_ISSUER)
    private readonly accessTokens: AccessTokenIssuerPort,
    @Inject(REFRESH_TOKEN_STORE)
    private readonly refreshTokens: RefreshTokenStorePort,
  ) {}

  async execute(body: unknown): Promise<LoginResponse> {
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const account = await this.accounts.findByEmail(
      parsed.data.cityId,
      parsed.data.email,
    );

    if (!account) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    if (
      account.status !== 'active' ||
      account.emailVerificationState !== 'verified'
    ) {
      throw new ForbiddenException({ code: 'ACCOUNT_NOT_ACTIVE' });
    }

    const passwordHash = await this.accounts.findPasswordHash(
      parsed.data.cityId,
      account.id,
    );

    if (!passwordHash) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    const passwordMatches = await this.passwordHasher.verify(
      parsed.data.password,
      passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    const contributor = await this.contributors.findById(
      account.contributorId,
      parsed.data.cityId,
    );

    if (!contributor) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    const roles = (await this.accounts.listRoles(
      parsed.data.cityId,
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
    const familyId = randomUUID();
    const expiresAt = new Date(
      Date.now() + authConfig.refreshTokenTtlSeconds * 1000,
    );

    await this.refreshTokens.save({
      id: randomUUID(),
      cityId: parsed.data.cityId,
      userAccountId: account.id,
      tokenHash: hashRefreshToken(refreshToken),
      familyId,
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
