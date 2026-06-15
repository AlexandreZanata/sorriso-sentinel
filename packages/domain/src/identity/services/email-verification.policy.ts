export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export class EmailVerificationTokenExpiredError extends Error {
  constructor() {
    super('Email verification token has expired');
    this.name = 'EmailVerificationTokenExpiredError';
  }
}

export class EmailVerificationTokenInvalidError extends Error {
  constructor() {
    super('Email verification token is invalid');
    this.name = 'EmailVerificationTokenInvalidError';
  }
}

export class EmailVerificationPolicy {
  static assertTokenValid(params: {
    token: string;
    storedTokenHash: string;
    tokenIssuedAt: Date;
    clock: () => Date;
    hashToken: (token: string) => string;
  }): void {
    if (params.hashToken(params.token) !== params.storedTokenHash) {
      throw new EmailVerificationTokenInvalidError();
    }

    const elapsed = params.clock().getTime() - params.tokenIssuedAt.getTime();

    if (elapsed > EMAIL_VERIFICATION_TOKEN_TTL_MS) {
      throw new EmailVerificationTokenExpiredError();
    }
  }
}
