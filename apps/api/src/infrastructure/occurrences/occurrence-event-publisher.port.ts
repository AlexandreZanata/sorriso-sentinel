import type { OccurrenceCreatedEvent } from '@sorriso-sentinel/domain';

export interface OccurrenceEventPublisherPort {
  publish(event: OccurrenceCreatedEvent): Promise<void>;
}

export const OCCURRENCE_EVENT_PUBLISHER = Symbol('OCCURRENCE_EVENT_PUBLISHER');
