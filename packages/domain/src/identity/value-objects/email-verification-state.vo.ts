export const EMAIL_VERIFICATION_STATES = [
  'pending',
  'verified',
  'expired',
] as const;

export type EmailVerificationState = (typeof EMAIL_VERIFICATION_STATES)[number];

export const DEFAULT_EMAIL_VERIFICATION_STATE: EmailVerificationState = 'pending';

export class InvalidEmailVerificationStateError extends Error {
  constructor(value: string) {
    super(`Invalid email verification state: ${value}`);
    this.name = 'InvalidEmailVerificationStateError';
  }
}

export function parseEmailVerificationState(
  value: string,
): EmailVerificationState {
  if (!EMAIL_VERIFICATION_STATES.includes(value as EmailVerificationState)) {
    throw new InvalidEmailVerificationStateError(value);
  }

  return value as EmailVerificationState;
}
