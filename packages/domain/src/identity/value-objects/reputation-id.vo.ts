const REPUTATION_CODE_PATTERN = /^Rep-[A-Z0-9]{5}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class InvalidReputationIdError extends Error {
  constructor(value: string) {
    super(`Invalid reputation id: ${value}`);
    this.name = 'InvalidReputationIdError';
  }
}

export function parseReputationId(value: string): string {
  const trimmed = value.trim();

  if (REPUTATION_CODE_PATTERN.test(trimmed) || UUID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  throw new InvalidReputationIdError(value);
}
