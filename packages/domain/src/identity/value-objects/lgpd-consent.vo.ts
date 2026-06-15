export const LGPD_CONSENT_PURPOSES = [
  'account_creation',
  'email_communication',
  'fraud_prevention',
] as const;

export type LgpdConsentPurpose = (typeof LGPD_CONSENT_PURPOSES)[number];

export interface LgpdConsentProps {
  termsVersion: string;
  privacyVersion: string;
  consentedAt: Date;
  purposes: LgpdConsentPurpose[];
}

export class InvalidLgpdConsentError extends Error {
  constructor(reason: string) {
    super(`Invalid LGPD consent: ${reason}`);
    this.name = 'InvalidLgpdConsentError';
  }
}

export interface LgpdConsentPolicyConfig {
  currentTermsVersion: string;
  currentPrivacyVersion: string;
  requiredPurposes: LgpdConsentPurpose[];
}

export const DEFAULT_LGPD_CONSENT_POLICY: LgpdConsentPolicyConfig = {
  currentTermsVersion: '1.0.0',
  currentPrivacyVersion: '1.0.0',
  requiredPurposes: ['account_creation', 'email_communication'],
};

export function parseLgpdConsent(
  props: LgpdConsentProps,
  policy: LgpdConsentPolicyConfig = DEFAULT_LGPD_CONSENT_POLICY,
): LgpdConsentProps {
  if (!props.termsVersion?.trim()) {
    throw new InvalidLgpdConsentError('terms version is required');
  }

  if (!props.privacyVersion?.trim()) {
    throw new InvalidLgpdConsentError('privacy version is required');
  }

  if (!(props.consentedAt instanceof Date) || Number.isNaN(props.consentedAt.getTime())) {
    throw new InvalidLgpdConsentError('consentedAt must be a valid date');
  }

  if (props.termsVersion !== policy.currentTermsVersion) {
    throw new InvalidLgpdConsentError('terms version is outdated');
  }

  if (props.privacyVersion !== policy.currentPrivacyVersion) {
    throw new InvalidLgpdConsentError('privacy version is outdated');
  }

  for (const purpose of policy.requiredPurposes) {
    if (!props.purposes.includes(purpose)) {
      throw new InvalidLgpdConsentError(`missing required purpose: ${purpose}`);
    }
  }

  return rehydrateLgpdConsent(props);
}

export function rehydrateLgpdConsent(props: LgpdConsentProps): LgpdConsentProps {
  if (!props.termsVersion?.trim()) {
    throw new InvalidLgpdConsentError('terms version is required');
  }

  if (!props.privacyVersion?.trim()) {
    throw new InvalidLgpdConsentError('privacy version is required');
  }

  if (!(props.consentedAt instanceof Date) || Number.isNaN(props.consentedAt.getTime())) {
    throw new InvalidLgpdConsentError('consentedAt must be a valid date');
  }

  if (props.purposes.length === 0) {
    throw new InvalidLgpdConsentError('at least one purpose is required');
  }

  return {
    termsVersion: props.termsVersion.trim(),
    privacyVersion: props.privacyVersion.trim(),
    consentedAt: props.consentedAt,
    purposes: [...props.purposes],
  };
}
