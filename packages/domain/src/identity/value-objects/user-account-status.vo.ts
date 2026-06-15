export const USER_ACCOUNT_STATUSES = [
  'pending_verification',
  'active',
  'suspended',
  'deleted',
] as const;

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export const DEFAULT_USER_ACCOUNT_STATUS: UserAccountStatus =
  'pending_verification';

export class InvalidUserAccountStatusError extends Error {
  constructor(value: string) {
    super(`Invalid user account status: ${value}`);
    this.name = 'InvalidUserAccountStatusError';
  }
}

export function parseUserAccountStatus(value: string): UserAccountStatus {
  if (!USER_ACCOUNT_STATUSES.includes(value as UserAccountStatus)) {
    throw new InvalidUserAccountStatusError(value);
  }

  return value as UserAccountStatus;
}
