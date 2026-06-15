import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  occurrenceId: uuid('occurrence_id').notNull(),
  cityId: uuid('city_id').notNull(),
  requestedByReputationId: text('requested_by_reputation_id').notNull(),
  contentType: text('content_type').notNull(),
  declaredContentLength: integer('declared_content_length').notNull(),
  rawStorageKey: text('raw_storage_key').notNull(),
  sanitizedStorageKey: text('sanitized_storage_key'),
  processingStatus: text('processing_status').notNull().default('pending'),
  failureReason: text('failure_reason'),
  width: integer('width'),
  height: integer('height'),
  slotExpiresAt: timestamp('slot_expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  version: integer('version').notNull().default(1),
});

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type NewMediaAssetRow = typeof mediaAssets.$inferInsert;
