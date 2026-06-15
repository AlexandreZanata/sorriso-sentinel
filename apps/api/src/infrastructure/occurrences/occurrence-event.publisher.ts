import { Injectable } from '@nestjs/common';
import type { OccurrenceCreatedEvent } from '@sorriso-sentinel/domain';

export interface OccurrenceEventPublisherPort {
  publish(event: OccurrenceCreatedEvent): Promise<void>;
}

@Injectable()
export class NoOpOccurrenceEventPublisher implements OccurrenceEventPublisherPort {
  async publish(_event: OccurrenceCreatedEvent): Promise<void> {
    // Outbox / event bus integration deferred to a later vertical slice.
  }
}

export const OCCURRENCE_EVENT_PUBLISHER = Symbol('OCCURRENCE_EVENT_PUBLISHER');
