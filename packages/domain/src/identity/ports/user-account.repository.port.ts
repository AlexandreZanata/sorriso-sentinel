import type { UserAccountProps } from '../user-account.entity.js';

export interface EmailVerificationTokenRecord {
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface UserAccountRepositoryPort {
  save(account: UserAccountProps): Promise<void>;
  findById(cityId: string, id: string): Promise<UserAccountProps | null>;
  findByEmail(cityId: string, email: string): Promise<UserAccountProps | null>;
  findByContributorId(
    cityId: string,
    contributorId: string,
  ): Promise<UserAccountProps | null>;
  setPasswordHash(
    cityId: string,
    userAccountId: string,
    passwordHash: string,
  ): Promise<void>;
  findPasswordHash(
    cityId: string,
    userAccountId: string,
  ): Promise<string | null>;
  listRoles(cityId: string, userAccountId: string): Promise<string[]>;
  grantRole(
    cityId: string,
    userAccountId: string,
    role: string,
  ): Promise<void>;
  saveVerificationToken(
    userAccountId: string,
    record: EmailVerificationTokenRecord,
  ): Promise<void>;
  findVerificationToken(
    userAccountId: string,
  ): Promise<EmailVerificationTokenRecord | null>;
  deleteVerificationToken(userAccountId: string): Promise<void>;
}

export const USER_ACCOUNT_REPOSITORY = Symbol('USER_ACCOUNT_REPOSITORY');
