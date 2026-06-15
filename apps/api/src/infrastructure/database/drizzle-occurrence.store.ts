import { Inject, Injectable } from '@nestjs/common';
import type { AuthorDisplayPolicy } from '@sorriso-sentinel/domain';
import { occurrences, withCityContext } from '@sorriso-sentinel/database';
import { eq } from 'drizzle-orm';
import type pg from 'pg';
import {
  type OccurrenceStorePort,
  type StoredOccurrence,
} from '../occurrences/in-memory-occurrence.store';
import { DATABASE_POOL } from './database.tokens';

@Injectable()
export class DrizzleOccurrenceStore implements OccurrenceStorePort {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async save(occurrence: StoredOccurrence): Promise<void> {
    await withCityContext(this.pool, occurrence.cityId, async (db) => {
      await db.insert(occurrences).values({
        id: occurrence.id,
        cityId: occurrence.cityId,
        category: occurrence.category,
        status: occurrence.status,
        confidenceLevel: occurrence.confidenceLevel,
        latitude: occurrence.latitude,
        longitude: occurrence.longitude,
        privacyLevel: occurrence.privacyLevel,
        contributorReputationId: occurrence.reputationId,
        occurrenceKind: occurrence.occurrenceKind,
        isSensitive: occurrence.isSensitive,
        authorDisplayPolicy: occurrence.authorDisplayPolicy,
        description: occurrence.description,
        version: occurrence.version,
        createdAt: occurrence.createdAt,
        updatedAt: occurrence.createdAt,
      });
    });
  }

  async findById(
    id: string,
    cityId: string,
  ): Promise<StoredOccurrence | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(occurrences)
        .where(eq(occurrences.id, id))
        .limit(1);
      const row = rows[0];

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        cityId: row.cityId,
        category: row.category,
        occurrenceKind: row.occurrenceKind,
        status: row.status as 'unverified',
        confidenceLevel: row.confidenceLevel as 0,
        latitude: row.latitude,
        longitude: row.longitude,
        privacyLevel: row.privacyLevel,
        description: row.description ?? undefined,
        reputationId: row.contributorReputationId,
        authorDisplayPolicy: row.authorDisplayPolicy as AuthorDisplayPolicy,
        isSensitive: row.isSensitive,
        version: row.version,
        createdAt: row.createdAt,
      };
    });
  }
}
