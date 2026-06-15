export const OCCURRENCE_STATUSES = [
  'unverified',
  'under_review',
  'low_confidence',
  'active',
  'evolved',
  'resolved',
] as const;

export type OccurrenceStatus = (typeof OCCURRENCE_STATUSES)[number];

export class InvalidOccurrenceStatusError extends Error {
  constructor(value: string) {
    super(`Invalid occurrence status: ${value}`);
    this.name = 'InvalidOccurrenceStatusError';
  }
}

export function parseOccurrenceStatus(value: string): OccurrenceStatus {
  if ((OCCURRENCE_STATUSES as readonly string[]).includes(value)) {
    return value as OccurrenceStatus;
  }
  throw new InvalidOccurrenceStatusError(value);
}
