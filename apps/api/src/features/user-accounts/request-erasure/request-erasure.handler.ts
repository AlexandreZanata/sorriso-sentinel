import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvalidUserAccountStateError,
  UserAccount,
  USER_ACCOUNT_REPOSITORY,
  type UserAccountRepositoryPort,
} from '@sorriso-sentinel/domain';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';

@Injectable()
export class RequestErasureHandler {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly accounts: UserAccountRepositoryPort,
  ) {}

  async execute(session: SessionClaims): Promise<void> {
    const props = await this.accounts.findByContributorId(
      session.cityId,
      session.contributorId,
    );

    if (!props) {
      throw new NotFoundException({ code: 'USER_ACCOUNT_NOT_FOUND' });
    }

    const account = UserAccount.rehydrate(props);

    try {
      account.requestErasure(() => new Date());
    } catch (error) {
      if (error instanceof InvalidUserAccountStateError) {
        throw new BadRequestException({ code: 'INVALID_ACCOUNT_STATE' });
      }

      throw error;
    }

    await this.accounts.save(account.toProps());
    await this.accounts.deleteVerificationToken(account.id);
  }
}
