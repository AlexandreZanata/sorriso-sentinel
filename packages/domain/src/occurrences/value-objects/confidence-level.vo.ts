export class InvalidConfidenceLevelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidConfidenceLevelError';
  }
}

export function parseConfidenceLevel(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new InvalidConfidenceLevelError('confidence level must be an integer between 0 and 100');
  }

  return value;
}

export function parseInitialConfidenceLevel(value: number): number {
  if (value !== 0) {
    throw new InvalidConfidenceLevelError('initial confidence must be 0');
  }

  return 0;
}

export function initialConfidenceLevel(): number {
  return 0;
}
