const MIN_FINGERPRINT_LENGTH = 32;
const MAX_FINGERPRINT_LENGTH = 128;
const HEX_REGEX = /^[a-f0-9]+$/;

export class InvalidPqcPublicKeyRefError extends Error {
  constructor(reason: string) {
    super(`Invalid PQC public key reference: ${reason}`);
    this.name = 'InvalidPqcPublicKeyRefError';
  }
}

export function parsePqcPublicKeyRef(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (
    normalized.length < MIN_FINGERPRINT_LENGTH ||
    normalized.length > MAX_FINGERPRINT_LENGTH
  ) {
    throw new InvalidPqcPublicKeyRefError(
      `fingerprint must be between ${MIN_FINGERPRINT_LENGTH} and ${MAX_FINGERPRINT_LENGTH} hex characters`,
    );
  }

  if (!HEX_REGEX.test(normalized)) {
    throw new InvalidPqcPublicKeyRefError('must be lowercase hexadecimal');
  }

  return normalized;
}
