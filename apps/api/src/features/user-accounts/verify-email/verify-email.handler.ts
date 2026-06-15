import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CONTRIBUTOR_IDENTITY_REPOSITORY,
  InvalidUserAccountStateError,
  UserAccount,
  USER_ACCOUNT_REPOSITORY,
  type ContributorIdentityRepositoryPort,
  type UserAccountRepositoryPort,
} from '@sorriso-sentinel/domain';
import { verifyEmailSchema } from '@sorriso-sentinel/shared';
import { hashVerificationToken } from '../../../infrastructure/reputation/stub-reputation.port';

export interface VerifyEmailResponse {
  userAccountId: string;
  status: string;
  emailVerificationState: string;
}

@Injectable()
export class VerifyEmailHandler {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly accounts: UserAccountRepositoryPort,
    @Inject(CONTRIBUTOR_IDENTITY_REPOSITORY)
    private readonly contributors: ContributorIdentityRepositoryPort,
  ) {}

  async execute(body: unknown): Promise<VerifyEmailResponse> {
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const props = await this.accounts.findById(
      parsed.data.cityId,
      parsed.data.userAccountId,
    );

    if (!props) {
      throw new NotFoundException({ code: 'USER_ACCOUNT_NOT_FOUND' });
    }

    const tokenRecord = await this.accounts.findVerificationToken(
      parsed.data.userAccountId,
    );

    if (!tokenRecord) {
      throw new BadRequestException({ code: 'TOKEN_NOT_FOUND' });
    }

    const account = UserAccount.rehydrate(props);

    try {
      account.verifyEmail({
        token: parsed.data.token,
        storedTokenHash: tokenRecord.tokenHash,
        tokenIssuedAt: tokenRecord.issuedAt,
        clock: () => new Date(),
        hashToken: hashVerificationToken,
      });
    } catch (error) {
      if (error instanceof InvalidUserAccountStateError) {
        throw new BadRequestException({ code: 'INVALID_ACCOUNT_STATE' });
      }

      throw new BadRequestException({ code: 'TOKEN_INVALID_OR_EXPIRED' });
    }

    await this.accounts.save(account.toProps());
    await this.accounts.deleteVerificationToken(parsed.data.userAccountId);

    const contributor = await this.contributors.findById(
      account.contributorId,
      account.cityId,
    );

    if (contributor) {
      contributor.linkPublicProfile(account.id, () => new Date());
      await this.contributors.save(contributor);
    }

    return {
      userAccountId: account.id,
      status: account.status,
      emailVerificationState: account.emailVerificationState,
    };
  }
}
