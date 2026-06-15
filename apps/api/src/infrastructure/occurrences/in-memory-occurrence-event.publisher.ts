import { Injectable } from '@nestjs/common';
import type { OccurrenceCreatedEvent } from '@sorriso-sentinel/domain';
import type { OccurrenceEventPublisherPort } from './occurrence-event-publisher.port';

export interface StoredOutboxEvent {
  type: OccurrenceCreatedEvent['type'];
  payload: OccurrenceCreatedEvent['payload'];
}

@Injectable()
export class InMemoryOccurrenceEventPublisher implements OccurrenceEventPublisherPort {
  readonly events: StoredOutboxEvent[] = [];

  async publish(event: OccurrenceCreatedEvent): Promise<void> {
    this.events.push({
      type: event.type,
      payload: event.payload,
    });
  }
}
