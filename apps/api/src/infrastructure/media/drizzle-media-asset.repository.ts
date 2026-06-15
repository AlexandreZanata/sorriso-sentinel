import { Inject, Injectable } from '@nestjs/common';
import type { MediaAssetProps } from '@sorriso-sentinel/domain';
import type { MediaAssetRepositoryPort } from '@sorriso-sentinel/domain';
import { mediaAssets, withCityContext } from '@sorriso-sentinel/database';
import { and, eq, gte, inArray } from 'drizzle-orm';
import type pg from 'pg';
import { DATABASE_POOL } from '../database/database.tokens';

function rowToProps(row: typeof mediaAssets.$inferSelect): MediaAssetProps {
  return {
    id: row.id,
    occurrenceId: row.occurrenceId,
    cityId: row.cityId,
    requestedByReputationId: row.requestedByReputationId,
    contentType: row.contentType as MediaAssetProps['contentType'],
    declaredContentLength: row.declaredContentLength,
    rawStorageKey: row.rawStorageKey,
    sanitizedStorageKey: row.sanitizedStorageKey,
    processingStatus: row.processingStatus as MediaAssetProps['processingStatus'],
    failureReason: row.failureReason,
    width: row.width,
    height: row.height,
    slotExpiresAt: row.slotExpiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    version: row.version,
  };
}

@Injectable()
export class DrizzleMediaAssetRepository implements MediaAssetRepositoryPort {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async save(asset: MediaAssetProps): Promise<void> {
    await withCityContext(this.pool, asset.cityId, async (db) => {
      const existing = await db
        .select({ id: mediaAssets.id })
        .from(mediaAssets)
        .where(eq(mediaAssets.id, asset.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(mediaAssets)
          .set({
            sanitizedStorageKey: asset.sanitizedStorageKey,
            processingStatus: asset.processingStatus,
            failureReason: asset.failureReason,
            width: asset.width,
            height: asset.height,
            updatedAt: asset.updatedAt,
            version: asset.version,
          })
          .where(eq(mediaAssets.id, asset.id));
        return;
      }

      await db.insert(mediaAssets).values({
        id: asset.id,
        occurrenceId: asset.occurrenceId,
        cityId: asset.cityId,
        requestedByReputationId: asset.requestedByReputationId,
        contentType: asset.contentType,
        declaredContentLength: asset.declaredContentLength,
        rawStorageKey: asset.rawStorageKey,
        sanitizedStorageKey: asset.sanitizedStorageKey,
        processingStatus: asset.processingStatus,
        failureReason: asset.failureReason,
        width: asset.width,
        height: asset.height,
        slotExpiresAt: asset.slotExpiresAt,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
        version: asset.version,
      });
    });
  }

  async findById(id: string, cityId: string): Promise<MediaAssetProps | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, id))
        .limit(1);

      return rows[0] ? rowToProps(rows[0]) : null;
    });
  }

  async countActiveByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<number> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select({ id: mediaAssets.id })
        .from(mediaAssets)
        .where(
          and(
            eq(mediaAssets.occurrenceId, occurrenceId),
            inArray(mediaAssets.processingStatus, [
              'pending',
              'processing',
              'ready',
            ]),
          ),
        );

      return rows.length;
    });
  }

  async countSlotsRequestedInLastHour(
    reputationId: string,
    cityId: string,
  ): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select({ id: mediaAssets.id })
        .from(mediaAssets)
        .where(
          and(
            eq(mediaAssets.requestedByReputationId, reputationId),
            gte(mediaAssets.createdAt, oneHourAgo),
          ),
        );

      return rows.length;
    });
  }

  async listReadyByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<MediaAssetProps[]> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(mediaAssets)
        .where(
          and(
            eq(mediaAssets.occurrenceId, occurrenceId),
            eq(mediaAssets.processingStatus, 'ready'),
          ),
        );

      return rows.map(rowToProps);
    });
  }
}
