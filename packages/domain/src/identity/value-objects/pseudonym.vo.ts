const MIN_LENGTH = 3;
const MAX_LENGTH = 32;

const DOXXING_PATTERNS = [
  /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/,
  /\b\d{11}\b/,
  /\(\d{2}\)\s?\d{4,5}-?\d{4}/,
  /\b\d{2}\s?\d{4,5}-?\d{4}\b/,
] as const;

export class InvalidPseudonymError extends Error {
  constructor(reason: string) {
    super(`Invalid pseudonym: ${reason}`);
    this.name = 'InvalidPseudonymError';
  }
}

function containsDoxxingPattern(value: string): boolean {
  return DOXXING_PATTERNS.some((pattern) => pattern.test(value));
}

export function parsePseudonym(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length < MIN_LENGTH) {
    throw new InvalidPseudonymError('must be at least 3 characters');
  }

  if (trimmed.length > MAX_LENGTH) {
    throw new InvalidPseudonymError('must be at most 32 characters');
  }

  if (containsDoxxingPattern(trimmed)) {
    throw new InvalidPseudonymError('contains disallowed personal data pattern');
  }

  return trimmed;
}
