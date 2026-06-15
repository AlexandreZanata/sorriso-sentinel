import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const occurrenceComments = pgTable('occurrence_comments', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  occurrenceId: uuid('occurrence_id').notNull(),
  cityId: uuid('city_id').notNull(),
  authorReputationId: text('author_reputation_id').notNull(),
  parentCommentId: uuid('parent_comment_id'),
  text: text('text').notNull(),
  authorDisplayPolicy: text('author_display_policy').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type OccurrenceCommentRow = typeof occurrenceComments.$inferSelect;
export type NewOccurrenceCommentRow = typeof occurrenceComments.$inferInsert;
