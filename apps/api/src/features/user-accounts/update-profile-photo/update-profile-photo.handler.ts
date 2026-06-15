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
import { updateProfilePhotoSchema } from '@sorriso-sentinel/shared';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';

export interface UpdateProfilePhotoResponse {
  profilePhoto: {
    visibility: string;
    url: string | null;
  };
  version: number;
}

@Injectable()
export class UpdateProfilePhotoHandler {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly accounts: UserAccountRepositoryPort,
  ) {}

  async execute(
    body: unknown,
    session: SessionClaims,
  ): Promise<UpdateProfilePhotoResponse> {
    const parsed = updateProfilePhotoSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const props = await this.accounts.findByContributorId(
      session.cityId,
      session.contributorId,
    );

    if (!props) {
      throw new NotFoundException({ code: 'USER_ACCOUNT_NOT_FOUND' });
    }

    const account = UserAccount.rehydrate(props);

    try {
      account.updateProfilePhoto({
        storageKey: parsed.data.storageKey,
        visibility: parsed.data.visibility,
        clock: () => new Date(),
      });
    } catch (error) {
      if (error instanceof InvalidUserAccountStateError) {
        throw new BadRequestException({ code: 'INVALID_ACCOUNT_STATE' });
      }

      throw error;
    }

    await this.accounts.save(account.toProps());

    const url =
      account.profilePhotoStorageKey !== null
        ? `/media/profile/${account.profilePhotoStorageKey}`
        : null;

    return {
      profilePhoto: {
        visibility: account.profilePhotoVisibility,
        url,
      },
      version: account.version,
    };
  }
}
