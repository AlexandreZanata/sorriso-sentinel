import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  ABUSE_SIGNAL_PORT,
  ContributorAlreadyHasAccountError,
  DeviceAlreadyRegisteredError,
  EmailAlreadyUsedError,
  InvalidDeviceProofError,
  InvalidLgpdConsentError,
  PQC_CRYPTO_PORT,
  UserAccount,
  USER_ACCOUNT_REPOSITORY,
  type AbuseSignalPort,
  type PqcCryptoPort,
  type UserAccountRepositoryPort,
} from '@sorriso-sentinel/domain';
import { registerUserAccountSchema } from '@sorriso-sentinel/shared';
import { randomUUID } from 'node:crypto';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import {
  buildDeviceBindingDigest,
  decodePqcSignature,
} from '../../../infrastructure/identity/device-binding.service';
import {
  createVerificationToken,
  hashVerificationToken,
} from '../../../infrastructure/reputation/stub-reputation.port';

const deviceBindingSecret =
  process.env.DEVICE_BINDING_SECRET ?? 'dev-device-binding-secret';

export interface RegisterUserAccountResponse {
  userAccountId: string;
  status: string;
  emailVerificationState: string;
  verificationToken: string;
}

@Injectable()
export class RegisterUserAccountHandler {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly accounts: UserAccountRepositoryPort,
    @Inject(ABUSE_SIGNAL_PORT)
    private readonly abuseSignal: AbuseSignalPort,
    @Inject(PQC_CRYPTO_PORT)
    private readonly pqcCrypto: PqcCryptoPort,
  ) {}

  async execute(
    body: unknown,
    session: SessionClaims,
  ): Promise<RegisterUserAccountResponse> {
    const parsed = registerUserAccountSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const deviceBindingDigest = buildDeviceBindingDigest({
      cityId: session.cityId,
      contributorId: session.contributorId,
      deviceNonce: parsed.data.deviceNonce,
      secret: deviceBindingSecret,
    });

    let account: UserAccount;
    let event: Awaited<ReturnType<typeof UserAccount.registerNew>>['event'];

    try {
      const result = await UserAccount.registerNew({
        id: randomUUID(),
        cityId: session.cityId,
        contributorId: session.contributorId,
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        deviceBindingDigest,
        lgpdConsent: {
          ...parsed.data.lgpdConsent,
          consentedAt: new Date(parsed.data.lgpdConsent.consentedAt),
        },
        deviceProof: {
          deviceNonce: parsed.data.deviceNonce,
          signature: decodePqcSignature(parsed.data.pqcSignature),
          publicKeyRef: parsed.data.pqcPublicKeyRef,
        },
        abuseSignal: this.abuseSignal,
        pqcCrypto: this.pqcCrypto,
        isEmailAlreadyUsed: (cityId, email) =>
          this.accounts.findByEmail(cityId, email).then(Boolean),
        contributorHasAccount: (cityId, contributorId) =>
          this.accounts
            .findByContributorId(cityId, contributorId)
            .then(Boolean),
        clock: () => new Date(),
      });

      account = result.account;
      event = result.event;
    } catch (error) {
      this.rethrowDomainError(error);
    }

    const verificationToken = createVerificationToken();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);

    await this.accounts.save(account.toProps());
    await this.accounts.saveVerificationToken(account.id, {
      tokenHash: hashVerificationToken(verificationToken),
      issuedAt,
      expiresAt,
    });

    void event;

    return {
      userAccountId: account.id,
      status: account.status,
      emailVerificationState: account.emailVerificationState,
      verificationToken,
    };
  }

  private rethrowDomainError(error: unknown): never {
    if (error instanceof ContributorAlreadyHasAccountError) {
      throw new ConflictException({ code: 'CONTRIBUTOR_ALREADY_HAS_ACCOUNT' });
    }

    if (error instanceof EmailAlreadyUsedError) {
      throw new ConflictException({ code: 'EMAIL_ALREADY_USED' });
    }

    if (error instanceof DeviceAlreadyRegisteredError) {
      throw new ConflictException({ code: 'DEVICE_ALREADY_REGISTERED' });
    }

    if (error instanceof InvalidDeviceProofError) {
      throw new BadRequestException({ code: 'INVALID_DEVICE_PROOF' });
    }

    if (error instanceof InvalidLgpdConsentError) {
      throw new BadRequestException({ code: 'INVALID_LGPD_CONSENT' });
    }

    throw error;
  }
}
