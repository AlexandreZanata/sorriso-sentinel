import { describe, expect, it, vi } from 'vitest';
import type { AbuseSignalPort } from '../ports/abuse-signal.port.js';
import type { PqcCryptoPort } from '../ports/pqc-crypto.port.js';
import type { LgpdConsentProps } from '../value-objects/lgpd-consent.vo.js';
import {
  EmailAlreadyUsedError,
  InvalidDeviceProofError,
  UserAccountRegistrationGuard,
} from './user-account-registration.guard.js';

describe('UserAccountRegistrationGuard', () => {
  const digest = 'c'.repeat(64);
  const pqcRef = 'd'.repeat(64);
  const signature = new TextEncoder().encode('signature');
  const consent: LgpdConsentProps = {
    termsVersion: '1.0.0',
    privacyVersion: '1.0.0',
    consentedAt: new Date('2026-06-15T12:00:00Z'),
    purposes: ['account_creation', 'email_communication'],
  };

  const abuseSignal: AbuseSignalPort = {
    isDeviceAlreadyRegistered: vi.fn().mockResolvedValue(false),
    registerDeviceBinding: vi.fn(),
  };

  const baseParams = {
    cityId: 'city-1',
    contributorId: 'contributor-1',
    email: 'user@example.com',
    deviceBindingDigest: digest,
    lgpdConsent: consent,
    deviceProof: {
      deviceNonce: 'nonce-1',
      signature,
      publicKeyRef: pqcRef,
    },
    abuseSignal,
    isEmailAlreadyUsed: vi.fn().mockResolvedValue(false),
    contributorHasAccount: vi.fn().mockResolvedValue(false),
  };

  it('should_reject_registration_without_valid_pqc_signature', async () => {
    const pqcCrypto: PqcCryptoPort = {
      verifyMlDsaSignature: vi.fn().mockResolvedValue(false),
    };

    await expect(
      UserAccountRegistrationGuard.assertCanRegister({
        ...baseParams,
        pqcCrypto,
      }),
    ).rejects.toThrow(InvalidDeviceProofError);
  });

  it('should_reject_registration_when_email_already_used', async () => {
    const pqcCrypto: PqcCryptoPort = {
      verifyMlDsaSignature: vi.fn().mockResolvedValue(true),
    };

    await expect(
      UserAccountRegistrationGuard.assertCanRegister({
        ...baseParams,
        pqcCrypto,
        isEmailAlreadyUsed: vi.fn().mockResolvedValue(true),
      }),
    ).rejects.toThrow(EmailAlreadyUsedError);
  });

  it('should_reject_registration_without_lgpd_consent', async () => {
    const pqcCrypto: PqcCryptoPort = {
      verifyMlDsaSignature: vi.fn().mockResolvedValue(true),
    };

    await expect(
      UserAccountRegistrationGuard.assertCanRegister({
        ...baseParams,
        pqcCrypto,
        lgpdConsent: { ...consent, termsVersion: '' },
      }),
    ).rejects.toThrow(/Invalid LGPD consent/);
  });

  it('should_pass_all_guards_for_valid_registration', async () => {
    const pqcCrypto: PqcCryptoPort = {
      verifyMlDsaSignature: vi.fn().mockResolvedValue(true),
    };

    await expect(
      UserAccountRegistrationGuard.assertCanRegister({
        ...baseParams,
        pqcCrypto,
      }),
    ).resolves.toBeUndefined();
  });
});
