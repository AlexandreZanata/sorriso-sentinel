import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EMAIL_VERIFICATION_STATE,
  parseEmailVerificationState,
} from './email-verification-state.vo.js';

describe('EmailVerificationState', () => {
  it('should_default_email_verification_state_to_pending', () => {
    expect(DEFAULT_EMAIL_VERIFICATION_STATE).toBe('pending');
  });

  it('should_reject_invalid_state', () => {
    expect(() => parseEmailVerificationState('unknown')).toThrow(
      /Invalid email verification state/,
    );
  });
});
