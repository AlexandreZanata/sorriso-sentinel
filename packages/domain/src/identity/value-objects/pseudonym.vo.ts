import { containsDoxxingPattern } from '../services/doxxing-patterns.js';

const MIN_LENGTH = 3;
const MAX_LENGTH = 32;

export class InvalidPseudonymError extends Error {
  constructor(reason: string) {
    super(`Invalid pseudonym: ${reason}`);
    this.name = 'InvalidPseudonymError';
  }
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
