import { containsDoxxingPattern } from '../services/doxxing-patterns.js';

const MIN_LENGTH = 2;
const MAX_LENGTH = 64;

export class InvalidDisplayNameError extends Error {
  constructor(reason: string) {
    super(`Invalid display name: ${reason}`);
    this.name = 'InvalidDisplayNameError';
  }
}

export function parseDisplayName(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length < MIN_LENGTH) {
    throw new InvalidDisplayNameError('must be at least 2 characters');
  }

  if (trimmed.length > MAX_LENGTH) {
    throw new InvalidDisplayNameError('must be at most 64 characters');
  }

  if (containsDoxxingPattern(trimmed)) {
    throw new InvalidDisplayNameError(
      'contains disallowed personal data pattern',
    );
  }

  return trimmed;
}
