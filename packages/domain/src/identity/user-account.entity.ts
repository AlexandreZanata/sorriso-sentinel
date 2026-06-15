import type { AbuseSignalPort } from './ports/abuse-signal.port.js';
import { DEVICE_BINDING_TTL_SECONDS } from './ports/abuse-signal.port.js';
import type { PqcCryptoPort } from './ports/pqc-crypto.port.js';
import { EmailVerificationPolicy } from './services/email-verification.policy.js';
import { UserAccountRegistrationGuard } from './services/user-account-registration.guard.js';
import { parseDisplayName } from './value-objects/display-name.vo.js';
import { parseEmailAddress } from './value-objects/email-address.vo.js';
import {
  DEFAULT_EMAIL_VERIFICATION_STATE,
  parseEmailVerificationState,
  type EmailVerificationState,
} from './value-objects/email-verification-state.vo.js';
import {
  parseLgpdConsent,
  rehydrateLgpdConsent,
  type LgpdConsentProps,
} from './value-objects/lgpd-consent.vo.js';
import { parsePqcPublicKeyRef } from './value-objects/pqc-public-key-ref.vo.js';
import {
  DEFAULT_USER_ACCOUNT_STATUS,
  parseUserAccountStatus,
  type UserAccountStatus,
} from './value-objects/user-account-status.vo.js';
import { UserAccountCreatedEvent } from './events/user-account-created.event.js';
import { EmailVerifiedEvent } from './events/email-verified.event.js';
import { UserAccountErasureRequestedEvent } from './events/user-account-erasure-requested.event.js';

export interface UserAccountProps {
  id: string;
  cityId: string;
  contributorId: string;
  email: string;
  displayName: string;
  status: UserAccountStatus;
  emailVerificationState: EmailVerificationState;
  showIdentityOnReports: boolean;
  pqcPublicKeyRef: string;
  lgpdConsent: LgpdConsentProps;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class InvalidUserAccountStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserAccountStateError';
  }
}

export class UserAccount {
  private constructor(private props: UserAccountProps) {}

  static async registerNew(params: {
    id: string;
    cityId: string;
    contributorId: string;
    email: string;
    displayName: string;
    deviceBindingDigest: string;
    lgpdConsent: LgpdConsentProps;
    deviceProof: {
      deviceNonce: string;
      signature: Uint8Array;
      publicKeyRef: string;
    };
    abuseSignal: AbuseSignalPort;
    pqcCrypto: PqcCryptoPort;
    isEmailAlreadyUsed: (cityId: string, email: string) => Promise<boolean>;
    contributorHasAccount: (
      cityId: string,
      contributorId: string,
    ) => Promise<boolean>;
    clock: () => Date;
  }): Promise<{ account: UserAccount; event: UserAccountCreatedEvent }> {
    await UserAccountRegistrationGuard.assertCanRegister({
      cityId: params.cityId,
      contributorId: params.contributorId,
      email: params.email,
      deviceBindingDigest: params.deviceBindingDigest,
      lgpdConsent: params.lgpdConsent,
      deviceProof: params.deviceProof,
      abuseSignal: params.abuseSignal,
      pqcCrypto: params.pqcCrypto,
      isEmailAlreadyUsed: params.isEmailAlreadyUsed,
      contributorHasAccount: params.contributorHasAccount,
    });

    const createdAt = params.clock();

    const account = new UserAccount({
      id: params.id,
      cityId: params.cityId,
      contributorId: params.contributorId,
      email: parseEmailAddress(params.email),
      displayName: parseDisplayName(params.displayName),
      status: DEFAULT_USER_ACCOUNT_STATUS,
      emailVerificationState: DEFAULT_EMAIL_VERIFICATION_STATE,
      showIdentityOnReports: false,
      pqcPublicKeyRef: parsePqcPublicKeyRef(params.deviceProof.publicKeyRef),
      lgpdConsent: parseLgpdConsent(params.lgpdConsent),
      version: 1,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    });

    await params.abuseSignal.registerDeviceBinding(
      params.cityId,
      params.deviceBindingDigest,
      DEVICE_BINDING_TTL_SECONDS,
    );

    return {
      account,
      event: new UserAccountCreatedEvent({
        userAccountId: account.id,
        cityId: account.cityId,
        contributorId: account.contributorId,
        status: account.status,
      }),
    };
  }

  static rehydrate(props: UserAccountProps): UserAccount {
    return new UserAccount({
      ...props,
      email: parseEmailAddress(props.email),
      displayName: parseDisplayName(props.displayName),
      status: parseUserAccountStatus(props.status),
      emailVerificationState: parseEmailVerificationState(
        props.emailVerificationState,
      ),
      pqcPublicKeyRef: parsePqcPublicKeyRef(props.pqcPublicKeyRef),
      lgpdConsent: rehydrateLgpdConsent(props.lgpdConsent),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get cityId(): string {
    return this.props.cityId;
  }

  get contributorId(): string {
    return this.props.contributorId;
  }

  get email(): string {
    return this.props.email;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get status(): UserAccountStatus {
    return this.props.status;
  }

  get emailVerificationState(): EmailVerificationState {
    return this.props.emailVerificationState;
  }

  get showIdentityOnReports(): boolean {
    return this.props.showIdentityOnReports;
  }

  get pqcPublicKeyRef(): string {
    return this.props.pqcPublicKeyRef;
  }

  get lgpdConsent(): LgpdConsentProps {
    return { ...this.props.lgpdConsent, purposes: [...this.props.lgpdConsent.purposes] };
  }

  get version(): number {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  verifyEmail(params: {
    token: string;
    storedTokenHash: string;
    tokenIssuedAt: Date;
    clock: () => Date;
    hashToken: (token: string) => string;
  }): EmailVerifiedEvent {
    if (this.props.status === 'active') {
      throw new InvalidUserAccountStateError('Account is already active');
    }

    if (this.props.status === 'deleted') {
      throw new InvalidUserAccountStateError('Account has been deleted');
    }

    EmailVerificationPolicy.assertTokenValid({
      token: params.token,
      storedTokenHash: params.storedTokenHash,
      tokenIssuedAt: params.tokenIssuedAt,
      clock: params.clock,
      hashToken: params.hashToken,
    });

    this.props.status = 'active';
    this.props.emailVerificationState = 'verified';
    this.props.version += 1;
    this.props.updatedAt = params.clock();

    return new EmailVerifiedEvent({
      userAccountId: this.id,
      cityId: this.cityId,
      contributorId: this.contributorId,
    });
  }

  updateDisplayName(displayName: string, clock: () => Date): void {
    if (this.props.status === 'deleted') {
      throw new InvalidUserAccountStateError('Account has been deleted');
    }

    this.props.displayName = parseDisplayName(displayName);
    this.props.version += 1;
    this.props.updatedAt = clock();
  }

  revokeConsent(clock: () => Date): void {
    if (this.props.status === 'deleted') {
      throw new InvalidUserAccountStateError('Account has been deleted');
    }

    this.props.status = 'suspended';
    this.props.version += 1;
    this.props.updatedAt = clock();
  }

  requestErasure(clock: () => Date): UserAccountErasureRequestedEvent {
    if (this.props.status === 'deleted') {
      throw new InvalidUserAccountStateError('Account has already been erased');
    }

    const requestedAt = clock();

    this.props.email = `erased-${this.props.id}@anonymous.local`;
    this.props.displayName = 'Anonymous';
    this.props.status = 'deleted';
    this.props.emailVerificationState = 'expired';
    this.props.showIdentityOnReports = false;
    this.props.deletedAt = requestedAt;
    this.props.version += 1;
    this.props.updatedAt = requestedAt;

    return new UserAccountErasureRequestedEvent({
      userAccountId: this.id,
      cityId: this.cityId,
      requestedAt: requestedAt.toISOString(),
    });
  }

  exportPersonalData(): Record<string, unknown> {
    return {
      id: this.props.id,
      cityId: this.props.cityId,
      contributorId: this.props.contributorId,
      email: this.props.email,
      displayName: this.props.displayName,
      status: this.props.status,
      emailVerificationState: this.props.emailVerificationState,
      showIdentityOnReports: this.props.showIdentityOnReports,
      lgpdConsent: this.props.lgpdConsent,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  toProps(): UserAccountProps {
    return {
      ...this.props,
      lgpdConsent: {
        ...this.props.lgpdConsent,
        purposes: [...this.props.lgpdConsent.purposes],
      },
    };
  }
}
