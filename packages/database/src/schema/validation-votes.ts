import { sql } from 'drizzle-orm';
import {
  doublePrecision,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const validationVotes = pgTable('validation_votes', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  occurrenceId: uuid('occurrence_id').notNull(),
  cityId: uuid('city_id').notNull(),
  voterReputationId: text('voter_reputation_id').notNull(),
  voteType: text('vote_type').notNull(),
  reason: text('reason'),
  trustWeightApplied: doublePrecision('trust_weight_applied').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ValidationVoteRow = typeof validationVotes.$inferSelect;
export type NewValidationVoteRow = typeof validationVotes.$inferInsert;
