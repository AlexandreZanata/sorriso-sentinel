import type { OccurrenceStatus } from './occurrence-status.vo.js';

export interface OccurrenceCreatedPayload {
  occurrenceId: string;
  cityId: string;
  category: string;
  status: OccurrenceStatus;
  occurredAt: Date;
}

export class OccurrenceCreatedEvent {
  readonly type = 'OccurrenceCreated' as const;

  constructor(readonly payload: OccurrenceCreatedPayload) {}
}
