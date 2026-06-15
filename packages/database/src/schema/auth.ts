import { sql } from 'drizzle-orm';
import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { userAccounts } from './user-accounts.js';

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  cityId: uuid('city_id').notNull(),
  userAccountId: uuid('user_account_id')
    .notNull()
    .references(() => userAccounts.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  familyId: uuid('family_id').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userAccountRoles = pgTable(
  'user_account_roles',
  {
    userAccountId: uuid('user_account_id')
      .notNull()
      .references(() => userAccounts.id, { onDelete: 'cascade' }),
    cityId: uuid('city_id').notNull(),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userAccountId, table.role] }),
  ],
);
