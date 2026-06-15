import type { OccurrenceStatus } from '../../occurrences/occurrence-status.vo.js';

export interface OccurrenceConfidenceChangedPayload {
  occurrenceId: string;
  cityId: string;
  fromConfidence: number;
  toConfidence: number;
  status: OccurrenceStatus;
}

export class OccurrenceConfidenceChangedEvent {
  readonly type = 'OccurrenceConfidenceChanged' as const;

  constructor(readonly payload: OccurrenceConfidenceChangedPayload) {}
}
