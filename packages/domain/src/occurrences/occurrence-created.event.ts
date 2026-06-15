import type { OccurrenceStatus } from './occurrence-status.vo.js';

export interface OccurrenceCreatedPayload {
  occurrenceId: string;
  cityId: string;
  category: string;
  occurrenceKind: string;
  status: OccurrenceStatus;
  confidenceLevel: number;
  privacyLevel: string;
  isSensitive: boolean;
  occurredAt: Date;
}

export class OccurrenceCreatedEvent {
  readonly type = 'OccurrenceCreated' as const;

  constructor(readonly payload: OccurrenceCreatedPayload) {}
}
