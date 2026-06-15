import { Inject, Injectable } from '@nestjs/common';
import type { OccurrenceCreatedEvent } from '@sorriso-sentinel/domain';
import { domainOutbox, withCityContext } from '@sorriso-sentinel/database';
import type pg from 'pg';
import { DATABASE_POOL } from '../database/database.tokens';
import type { OccurrenceEventPublisherPort } from './occurrence-event-publisher.port';

@Injectable()
export class DrizzleOccurrenceEventPublisher implements OccurrenceEventPublisherPort {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async publish(event: OccurrenceCreatedEvent): Promise<void> {
    await withCityContext(this.pool, event.payload.cityId, async (db) => {
      await db.insert(domainOutbox).values({
        cityId: event.payload.cityId,
        eventType: event.type,
        payload: {
          occurrenceId: event.payload.occurrenceId,
          cityId: event.payload.cityId,
          category: event.payload.category,
          occurrenceKind: event.payload.occurrenceKind,
          status: event.payload.status,
          confidenceLevel: event.payload.confidenceLevel,
          privacyLevel: event.payload.privacyLevel,
          isSensitive: event.payload.isSensitive,
          occurredAt: event.payload.occurredAt.toISOString(),
        },
      });
    });
  }
}
