import { describe, expect, it } from 'vitest';
import {
  EmailVerificationPolicy,
  EmailVerificationTokenExpiredError,
  EmailVerificationTokenInvalidError,
} from './email-verification.policy.js';

describe('EmailVerificationPolicy', () => {
  const hashToken = (token: string) => `hash:${token}`;
  const issuedAt = new Date('2026-06-15T12:00:00Z');

  it('should_accept_valid_email_verification_token_within_24h', () => {
    expect(() =>
      EmailVerificationPolicy.assertTokenValid({
        token: 'valid-token',
        storedTokenHash: 'hash:valid-token',
        tokenIssuedAt: issuedAt,
        clock: () => new Date('2026-06-15T20:00:00Z'),
        hashToken,
      }),
    ).not.toThrow();
  });

  it('should_reject_expired_email_verification_token', () => {
    expect(() =>
      EmailVerificationPolicy.assertTokenValid({
        token: 'valid-token',
        storedTokenHash: 'hash:valid-token',
        tokenIssuedAt: issuedAt,
        clock: () => new Date('2026-06-17T12:00:00Z'),
        hashToken,
      }),
    ).toThrow(EmailVerificationTokenExpiredError);
  });

  it('should_reject_invalid_token_hash', () => {
    expect(() =>
      EmailVerificationPolicy.assertTokenValid({
        token: 'wrong-token',
        storedTokenHash: 'hash:valid-token',
        tokenIssuedAt: issuedAt,
        clock: () => new Date('2026-06-15T13:00:00Z'),
        hashToken,
      }),
    ).toThrow(EmailVerificationTokenInvalidError);
  });
});
