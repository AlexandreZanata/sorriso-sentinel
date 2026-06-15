export class InvalidLocalKeyReferenceError extends Error {
  constructor() {
    super('Invalid local key reference');
    this.name = 'InvalidLocalKeyReferenceError';
  }
}

export function parseLocalKeyReference(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length < 8 || trimmed.length > 128) {
    throw new InvalidLocalKeyReferenceError();
  }

  return trimmed;
}
