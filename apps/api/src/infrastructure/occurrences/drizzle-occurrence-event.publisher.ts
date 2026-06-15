import { Inject, Injectable } from '@nestjs/common';
import { domainOutbox, withCityContext } from '@sorriso-sentinel/database';
import type pg from 'pg';
import { DATABASE_POOL } from '../database/database.tokens';
import type {
  OccurrenceDomainEvent,
  OccurrenceEventPublisherPort,
} from './occurrence-event-publisher.port';

@Injectable()
export class DrizzleOccurrenceEventPublisher implements OccurrenceEventPublisherPort {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async publish(event: OccurrenceDomainEvent): Promise<void> {
    await withCityContext(this.pool, event.payload.cityId, async (db) => {
      await db.insert(domainOutbox).values({
        cityId: event.payload.cityId,
        eventType: event.type,
        payload: this.serializePayload(event),
      });
    });
  }

  private serializePayload(event: OccurrenceDomainEvent): Record<string, unknown> {
    switch (event.type) {
      case 'OccurrenceCreated':
        return {
          occurrenceId: event.payload.occurrenceId,
          cityId: event.payload.cityId,
          category: event.payload.category,
          occurrenceKind: event.payload.occurrenceKind,
          status: event.payload.status,
          confidenceLevel: event.payload.confidenceLevel,
          privacyLevel: event.payload.privacyLevel,
          isSensitive: event.payload.isSensitive,
          occurredAt: event.payload.occurredAt.toISOString(),
        };
      case 'OccurrenceConfirmed':
        return {
          occurrenceId: event.payload.occurrenceId,
          cityId: event.payload.cityId,
          newConfidence: event.payload.newConfidence,
          distinctConfirms: event.payload.distinctConfirms,
        };
      case 'OccurrenceDenied':
        return {
          occurrenceId: event.payload.occurrenceId,
          cityId: event.payload.cityId,
          newConfidence: event.payload.newConfidence,
        };
      case 'OccurrenceConfidenceChanged':
        return {
          occurrenceId: event.payload.occurrenceId,
          cityId: event.payload.cityId,
          fromConfidence: event.payload.fromConfidence,
          toConfidence: event.payload.toConfidence,
          status: event.payload.status,
        };
      default:
        return {};
    }
  }
}
