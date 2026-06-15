import type {
  OccurrenceConfidenceChangedEvent,
  OccurrenceConfirmedEvent,
  OccurrenceCreatedEvent,
  OccurrenceDeniedEvent,
} from '@sorriso-sentinel/domain';

export type OccurrenceDomainEvent =
  | OccurrenceCreatedEvent
  | OccurrenceConfirmedEvent
  | OccurrenceDeniedEvent
  | OccurrenceConfidenceChangedEvent;

export interface OccurrenceEventPublisherPort {
  publish(event: OccurrenceDomainEvent): Promise<void>;
}

export const OCCURRENCE_EVENT_PUBLISHER = Symbol('OCCURRENCE_EVENT_PUBLISHER');
