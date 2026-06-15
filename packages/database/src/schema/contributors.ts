import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const contributors = pgTable(
  'contributors',
  {
    id: uuid('id').primaryKey(),
    cityId: uuid('city_id').notNull(),
    reputationId: text('reputation_id').notNull(),
    identityMode: text('identity_mode').notNull().default('ghost'),
    pseudonym: text('pseudonym'),
    publicProfileId: uuid('public_profile_id'),
    localKeyRef: text('local_key_fingerprint').notNull(),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('contributors_city_local_key_unique').on(
      table.cityId,
      table.localKeyRef,
    ),
    uniqueIndex('contributors_city_pseudonym_unique').on(
      table.cityId,
      table.pseudonym,
    ),
  ],
);

export type ContributorRow = typeof contributors.$inferSelect;
export type NewContributorRow = typeof contributors.$inferInsert;
