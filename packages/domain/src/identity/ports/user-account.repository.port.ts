import type { UserAccountProps } from '../user-account.entity.js';

export interface UserAccountRepositoryPort {
  save(account: UserAccountProps): Promise<void>;
  findByEmail(cityId: string, email: string): Promise<UserAccountProps | null>;
  findByContributorId(
    cityId: string,
    contributorId: string,
  ): Promise<UserAccountProps | null>;
}
