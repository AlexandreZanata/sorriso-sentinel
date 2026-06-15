const MAX_DESCRIPTION_LENGTH = 2000;

export class InvalidOccurrenceDescriptionError extends Error {
  constructor(reason: string) {
    super(`Invalid occurrence description: ${reason}`);
    this.name = 'InvalidOccurrenceDescriptionError';
  }
}

export function parseOccurrenceDescription(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw new InvalidOccurrenceDescriptionError('must be at most 2000 characters');
  }

  return trimmed;
}
