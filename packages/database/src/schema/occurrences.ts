import { sql } from 'drizzle-orm';
import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  doublePrecision,
} from 'drizzle-orm/pg-core';

export const occurrences = pgTable('occurrences', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  cityId: uuid('city_id').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull().default('unverified'),
  confidenceLevel: integer('confidence_level').notNull().default(0),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  privacyLevel: text('privacy_level').notNull().default('public'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type OccurrenceRow = typeof occurrences.$inferSelect;
export type NewOccurrenceRow = typeof occurrences.$inferInsert;
