import { Inject, Injectable } from '@nestjs/common';
import type { AuthorDisplayPolicy, OccurrenceStatus } from '@sorriso-sentinel/domain';
import { occurrences, withCityContext } from '@sorriso-sentinel/database';
import { encodeOccurrenceCursor } from '@sorriso-sentinel/shared';
import {
  and,
  desc,
  eq,
  gte,
  isNull,
  lt,
  lte,
  ne,
  or,
} from 'drizzle-orm';
import type pg from 'pg';
import {
  OccurrenceUpdateConflictError,
  type OccurrenceListFilter,
  type OccurrenceListResult,
  type OccurrenceStorePort,
  type StoredOccurrence,
} from '../occurrences/in-memory-occurrence.store';
import { DATABASE_POOL } from './database.tokens';

function rowToStored(row: typeof occurrences.$inferSelect): StoredOccurrence {
  return {
    id: row.id,
    cityId: row.cityId,
    category: row.category,
    occurrenceKind: row.occurrenceKind,
    status: row.status as OccurrenceStatus,
    confidenceLevel: row.confidenceLevel,
    latitude: row.latitude,
    longitude: row.longitude,
    privacyLevel: row.privacyLevel,
    description: row.description ?? undefined,
    reputationId: row.contributorReputationId,
    authorDisplayPolicy: row.authorDisplayPolicy as AuthorDisplayPolicy,
    isSensitive: row.isSensitive,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

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
        updatedAt: occurrence.updatedAt,
      });
    });
  }

  async update(
    occurrence: StoredOccurrence,
    expectedVersion: number,
  ): Promise<void> {
    await withCityContext(this.pool, occurrence.cityId, async (db) => {
      const rows = await db
        .update(occurrences)
        .set({
          status: occurrence.status,
          confidenceLevel: occurrence.confidenceLevel,
          version: occurrence.version,
          updatedAt: occurrence.updatedAt,
        })
        .where(
          and(
            eq(occurrences.id, occurrence.id),
            eq(occurrences.version, expectedVersion),
          ),
        )
        .returning({ id: occurrences.id });

      if (rows.length === 0) {
        throw new OccurrenceUpdateConflictError();
      }
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
        .where(and(eq(occurrences.id, id), isNull(occurrences.deletedAt)))
        .limit(1);
      const row = rows[0];

      if (!row) {
        return null;
      }

      return rowToStored(row);
    });
  }

  async listInBbox(
    cityId: string,
    filter: OccurrenceListFilter,
  ): Promise<OccurrenceListResult> {
    return withCityContext(this.pool, cityId, async (db) => {
      const conditions = [
        isNull(occurrences.deletedAt),
        ne(occurrences.privacyLevel, 'hidden'),
        gte(occurrences.latitude, filter.minLatitude),
        lte(occurrences.latitude, filter.maxLatitude),
        gte(occurrences.longitude, filter.minLongitude),
        lte(occurrences.longitude, filter.maxLongitude),
      ];

      if (filter.status) {
        conditions.push(eq(occurrences.status, filter.status));
      }

      if (filter.category) {
        conditions.push(eq(occurrences.category, filter.category));
      }

      if (filter.cursor) {
        conditions.push(
          or(
            lt(occurrences.createdAt, filter.cursor.createdAt),
            and(
              eq(occurrences.createdAt, filter.cursor.createdAt),
              lt(occurrences.id, filter.cursor.id),
            ),
          )!,
        );
      }

      const rows = await db
        .select()
        .from(occurrences)
        .where(and(...conditions))
        .orderBy(desc(occurrences.createdAt), desc(occurrences.id))
        .limit(filter.limit + 1);

      const items = rows.slice(0, filter.limit).map(rowToStored);
      const last = items.at(-1);
      const nextCursor =
        rows.length > filter.limit && last
          ? encodeOccurrenceCursor(last.createdAt, last.id)
          : undefined;

      return { items, nextCursor };
    });
  }
}
