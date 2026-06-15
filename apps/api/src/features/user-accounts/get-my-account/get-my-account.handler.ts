import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONTRIBUTOR_IDENTITY_REPOSITORY,
  UserAccount,
  USER_ACCOUNT_REPOSITORY,
  type ContributorIdentityRepositoryPort,
  type UserAccountRepositoryPort,
} from '@sorriso-sentinel/domain';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import {
  REPUTATION_PORT,
} from '../../../infrastructure/reputation/stub-reputation.port';
import type { ReputationPort } from '@sorriso-sentinel/domain';

export interface GetMyAccountResponse {
  id: string;
  email: string;
  displayName: string;
  status: string;
  emailVerificationState: string;
  showIdentityOnReports: boolean;
  profilePhoto: {
    visibility: string;
    url: string | null;
  };
  contributor: {
    contributorId: string;
    reputationId: string;
    identityMode: string;
    pseudonym: string | null;
  };
  reputation: {
    trustedSourceLabel: string;
  };
}

@Injectable()
export class GetMyAccountHandler {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly accounts: UserAccountRepositoryPort,
    @Inject(CONTRIBUTOR_IDENTITY_REPOSITORY)
    private readonly contributors: ContributorIdentityRepositoryPort,
    @Inject(REPUTATION_PORT)
    private readonly reputation: ReputationPort,
  ) {}

  async execute(session: SessionClaims): Promise<GetMyAccountResponse> {
    const props = await this.accounts.findByContributorId(
      session.cityId,
      session.contributorId,
    );

    if (!props) {
      throw new NotFoundException({ code: 'USER_ACCOUNT_NOT_FOUND' });
    }

    const account = UserAccount.rehydrate(props);
    const contributor = await this.contributors.findById(
      session.contributorId,
      session.cityId,
    );

    if (!contributor) {
      throw new NotFoundException({ code: 'CONTRIBUTOR_NOT_FOUND' });
    }

    const trustedSourceLabel = await this.reputation.getPublicLabel(
      session.reputationId,
      session.cityId,
    );

    const profilePhotoUrl = account.profilePhotoStorageKey
      ? `/media/profile/${account.profilePhotoStorageKey}`
      : null;

    return {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      status: account.status,
      emailVerificationState: account.emailVerificationState,
      showIdentityOnReports: account.showIdentityOnReports,
      profilePhoto: {
        visibility: account.profilePhotoVisibility,
        url: profilePhotoUrl,
      },
      contributor: {
        contributorId: contributor.id,
        reputationId: contributor.reputationId,
        identityMode: contributor.identityMode,
        pseudonym: contributor.pseudonym,
      },
      reputation: {
        trustedSourceLabel,
      },
    };
  }
}
