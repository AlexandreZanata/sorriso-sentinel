const EMAIL_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const MAX_LENGTH = 254;

export class InvalidEmailAddressError extends Error {
  constructor(reason: string) {
    super(`Invalid email address: ${reason}`);
    this.name = 'InvalidEmailAddressError';
  }
}

export function parseEmailAddress(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (normalized.length === 0 || normalized.length > MAX_LENGTH) {
    throw new InvalidEmailAddressError('must be between 1 and 254 characters');
  }

  if (!EMAIL_REGEX.test(normalized)) {
    throw new InvalidEmailAddressError('format is invalid');
  }

  return normalized;
}

export function normalizeEmailAddress(value: string): string {
  return parseEmailAddress(value);
}
