import { describe, expect, it } from 'vitest';
import {
  InvalidLgpdConsentError,
  parseLgpdConsent,
  type LgpdConsentProps,
} from './lgpd-consent.vo.js';

describe('LgpdConsent', () => {
  const validConsent: LgpdConsentProps = {
    termsVersion: '1.0.0',
    privacyVersion: '1.0.0',
    consentedAt: new Date('2026-06-15T12:00:00Z'),
    purposes: ['account_creation', 'email_communication'],
  };

  it('should_reject_lgpd_consent_without_terms_version', () => {
    expect(() =>
      parseLgpdConsent({ ...validConsent, termsVersion: '' }),
    ).toThrow(InvalidLgpdConsentError);
  });

  it('should_reject_lgpd_consent_with_outdated_privacy_version', () => {
    expect(() =>
      parseLgpdConsent({ ...validConsent, privacyVersion: '0.9.0' }),
    ).toThrow(/privacy version is outdated/);
  });

  it('should_accept_valid_lgpd_consent', () => {
    const consent = parseLgpdConsent(validConsent);
    expect(consent.termsVersion).toBe('1.0.0');
    expect(consent.purposes).toContain('account_creation');
  });
});
