import { Injectable } from '@nestjs/common';
import type { OccurrenceDomainEvent } from './occurrence-event-publisher.port';
import type { OccurrenceEventPublisherPort } from './occurrence-event-publisher.port';

@Injectable()
export class InMemoryOccurrenceEventPublisher implements OccurrenceEventPublisherPort {
  readonly events: OccurrenceDomainEvent[] = [];

  async publish(event: OccurrenceDomainEvent): Promise<void> {
    this.events.push(event);
  }
}
