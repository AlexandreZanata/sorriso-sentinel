import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const domainOutbox = pgTable('domain_outbox', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  cityId: uuid('city_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export type DomainOutboxRow = typeof domainOutbox.$inferSelect;
export type NewDomainOutboxRow = typeof domainOutbox.$inferInsert;
