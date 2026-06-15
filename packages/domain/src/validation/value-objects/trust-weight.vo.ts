const MIN_WEIGHT = 0.1;
const MAX_WEIGHT = 1.0;

export class InvalidTrustWeightError extends Error {
  constructor(reason: string) {
    super(`Invalid trust weight: ${reason}`);
    this.name = 'InvalidTrustWeightError';
  }
}

export function parseTrustWeight(value: number): number {
  if (!Number.isFinite(value) || value < MIN_WEIGHT || value > MAX_WEIGHT) {
    throw new InvalidTrustWeightError(`must be between ${MIN_WEIGHT} and ${MAX_WEIGHT}`);
  }

  return Math.round(value * 100) / 100;
}

export function fullTrustWeight(): number {
  return 1.0;
}

export function newContributorTrustWeight(): number {
  return 0.5;
}
