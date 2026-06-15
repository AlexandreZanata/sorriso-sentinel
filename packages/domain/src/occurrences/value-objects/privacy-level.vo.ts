export const PRIVACY_LEVELS = [
  'public',
  'neighborhood',
  'approximate',
  'hidden',
] as const;

export type PrivacyLevel = (typeof PRIVACY_LEVELS)[number];

export class InvalidPrivacyLevelError extends Error {
  constructor(value: string) {
    super(`Invalid privacy level: ${value}`);
    this.name = 'InvalidPrivacyLevelError';
  }
}

export function parsePrivacyLevel(value: string): PrivacyLevel {
  if ((PRIVACY_LEVELS as readonly string[]).includes(value)) {
    return value as PrivacyLevel;
  }

  throw new InvalidPrivacyLevelError(value);
}

export function defaultPrivacyLevel(): PrivacyLevel {
  return 'public';
}
