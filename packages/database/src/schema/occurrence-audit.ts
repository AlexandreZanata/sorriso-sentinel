import { sql } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const occurrenceAudit = pgTable('occurrence_audit', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  cityId: uuid('city_id').notNull(),
  occurrenceId: uuid('occurrence_id').notNull(),
  action: text('action').notNull(),
  actorType: text('actor_type').notNull(),
  actorRef: text('actor_ref'),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  isSensitive: boolean('is_sensitive').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type OccurrenceAuditRow = typeof occurrenceAudit.$inferSelect;
export type NewOccurrenceAuditRow = typeof occurrenceAudit.$inferInsert;
