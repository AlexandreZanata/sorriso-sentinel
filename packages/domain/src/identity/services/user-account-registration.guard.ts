import type { AbuseSignalPort } from '../ports/abuse-signal.port.js';
import {
  buildDeviceRegistrationMessage,
  type PqcCryptoPort,
} from '../ports/pqc-crypto.port.js';
import { SingleAccountPerDevicePolicy } from './single-account-per-device.policy.js';
import { parseDeviceBindingDigest } from '../value-objects/device-binding-digest.vo.js';
import { parseEmailAddress } from '../value-objects/email-address.vo.js';
import {
  parseLgpdConsent,
  type LgpdConsentProps,
} from '../value-objects/lgpd-consent.vo.js';

export class EmailAlreadyUsedError extends Error {
  constructor() {
    super('Email is already registered in this city');
    this.name = 'EmailAlreadyUsedError';
  }
}

export class InvalidDeviceProofError extends Error {
  constructor() {
    super('Invalid post-quantum device registration proof');
    this.name = 'InvalidDeviceProofError';
  }
}

export class ContributorAlreadyHasAccountError extends Error {
  constructor() {
    super('Contributor already has a linked user account');
    this.name = 'ContributorAlreadyHasAccountError';
  }
}

export class UserAccountRegistrationGuard {
  static async assertCanRegister(params: {
    cityId: string;
    contributorId: string;
    email: string;
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
  }): Promise<void> {
    if (!params.contributorId?.trim()) {
      throw new Error('Contributor id is required');
    }

    if (!params.cityId?.trim()) {
      throw new Error('City id is required');
    }

    parseEmailAddress(params.email);
    parseDeviceBindingDigest(params.deviceBindingDigest);
    parseLgpdConsent(params.lgpdConsent);

    if (await params.contributorHasAccount(params.cityId, params.contributorId)) {
      throw new ContributorAlreadyHasAccountError();
    }

    if (await params.isEmailAlreadyUsed(params.cityId, params.email)) {
      throw new EmailAlreadyUsedError();
    }

    await SingleAccountPerDevicePolicy.assertUniqueDevice({
      cityId: params.cityId,
      deviceBindingDigest: params.deviceBindingDigest,
      abuseSignal: params.abuseSignal,
    });

    const message = buildDeviceRegistrationMessage({
      contributorId: params.contributorId,
      cityId: params.cityId,
      deviceNonce: params.deviceProof.deviceNonce,
    });

    const validProof = await params.pqcCrypto.verifyMlDsaSignature({
      message,
      signature: params.deviceProof.signature,
      publicKeyRef: params.deviceProof.publicKeyRef,
    });

    if (!validProof) {
      throw new InvalidDeviceProofError();
    }
  }
}
