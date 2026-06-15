const DIGEST_LENGTH = 64;
const HEX_REGEX = /^[a-f0-9]{64}$/;

export class InvalidDeviceBindingDigestError extends Error {
  constructor(reason: string) {
    super(`Invalid device binding digest: ${reason}`);
    this.name = 'InvalidDeviceBindingDigestError';
  }
}

export function parseDeviceBindingDigest(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (normalized.length !== DIGEST_LENGTH) {
    throw new InvalidDeviceBindingDigestError(
      `must be exactly ${DIGEST_LENGTH} hex characters`,
    );
  }

  if (!HEX_REGEX.test(normalized)) {
    throw new InvalidDeviceBindingDigestError('must be lowercase hexadecimal');
  }

  return normalized;
}
