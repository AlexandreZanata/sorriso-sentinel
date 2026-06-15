import { describe, expect, it, vi } from 'vitest';
import type { AbuseSignalPort } from './ports/abuse-signal.port.js';
import type { PqcCryptoPort } from './ports/pqc-crypto.port.js';
import type { LgpdConsentProps } from './value-objects/lgpd-consent.vo.js';
import { UserAccount } from './user-account.entity.js';

describe('UserAccount', () => {
  const digest = 'e'.repeat(64);
  const pqcRef = 'f'.repeat(64);
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

  const pqcCrypto: PqcCryptoPort = {
    verifyMlDsaSignature: vi.fn().mockResolvedValue(true),
  };

  const registerParams = {
    id: 'account-1',
    cityId: 'city-1',
    contributorId: 'contributor-1',
    email: 'user@example.com',
    displayName: 'Civic User',
    deviceBindingDigest: digest,
    lgpdConsent: consent,
    deviceProof: {
      deviceNonce: 'nonce-1',
      signature,
      publicKeyRef: pqcRef,
    },
    abuseSignal,
    pqcCrypto,
    isEmailAlreadyUsed: vi.fn().mockResolvedValue(false),
    contributorHasAccount: vi.fn().mockResolvedValue(false),
    clock: () => new Date('2026-06-15T12:00:00Z'),
  };

  it('should_create_account_in_pending_verification_status', async () => {
    const { account } = await UserAccount.registerNew(registerParams);

    expect(account.status).toBe('pending_verification');
    expect(account.emailVerificationState).toBe('pending');
    expect(account.showIdentityOnReports).toBe(false);
  });

  it('should_require_existing_contributor_id_on_register', async () => {
    await expect(
      UserAccount.registerNew({
        ...registerParams,
        contributorId: '',
      }),
    ).rejects.toThrow(/Contributor id is required/);
  });

  it('should_activate_account_after_email_verification', async () => {
    const { account } = await UserAccount.registerNew(registerParams);

    const event = account.verifyEmail({
      token: 'verify-token',
      storedTokenHash: 'hash:verify-token',
      tokenIssuedAt: new Date('2026-06-15T12:00:00Z'),
      clock: () => new Date('2026-06-15T13:00:00Z'),
      hashToken: (token) => `hash:${token}`,
    });

    expect(account.status).toBe('active');
    expect(account.emailVerificationState).toBe('verified');
    expect(event.type).toBe('EmailVerified');
  });

  it('should_reject_verification_when_already_active', async () => {
    const { account } = await UserAccount.registerNew(registerParams);

    account.verifyEmail({
      token: 'verify-token',
      storedTokenHash: 'hash:verify-token',
      tokenIssuedAt: new Date('2026-06-15T12:00:00Z'),
      clock: () => new Date('2026-06-15T13:00:00Z'),
      hashToken: (token) => `hash:${token}`,
    });

    expect(() =>
      account.verifyEmail({
        token: 'verify-token',
        storedTokenHash: 'hash:verify-token',
        tokenIssuedAt: new Date('2026-06-15T12:00:00Z'),
        clock: () => new Date('2026-06-15T14:00:00Z'),
        hashToken: (token) => `hash:${token}`,
      }),
    ).toThrow(/already active/);
  });

  it('should_anonymize_email_on_erasure_request', async () => {
    const { account } = await UserAccount.registerNew(registerParams);

    account.requestErasure(() => new Date('2026-06-16T12:00:00Z'));

    expect(account.email).toBe('erased-account-1@anonymous.local');
    expect(account.displayName).toBe('Anonymous');
    expect(account.status).toBe('deleted');
  });

  it('should_increment_version_on_state_change', async () => {
    const { account } = await UserAccount.registerNew(registerParams);
    const initialVersion = account.version;

    account.verifyEmail({
      token: 'verify-token',
      storedTokenHash: 'hash:verify-token',
      tokenIssuedAt: new Date('2026-06-15T12:00:00Z'),
      clock: () => new Date('2026-06-15T13:00:00Z'),
      hashToken: (token) => `hash:${token}`,
    });

    expect(account.version).toBe(initialVersion + 1);
  });
});
