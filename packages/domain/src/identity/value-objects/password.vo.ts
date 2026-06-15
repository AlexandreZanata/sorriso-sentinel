export class InvalidPasswordError extends Error {
  constructor(message = 'Invalid password') {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

export function parsePassword(value: string): string {
  if (value.length < 12 || value.length > 128) {
    throw new InvalidPasswordError('Password must be between 12 and 128 characters');
  }

  return value;
}
