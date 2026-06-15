import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const userAccounts = pgTable('user_accounts', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  cityId: uuid('city_id').notNull(),
  contributorId: text('contributor_id').notNull(),
  emailNormalized: text('email_normalized').notNull(),
  emailCiphertext: text('email_ciphertext').notNull(),
  displayName: text('display_name').notNull(),
  status: text('status').notNull(),
  emailVerificationState: text('email_verification_state').notNull(),
  showIdentityOnReports: boolean('show_identity_on_reports')
    .notNull()
    .default(false),
  profilePhotoStorageKey: text('profile_photo_storage_key'),
  profilePhotoVisibility: text('profile_photo_visibility')
    .notNull()
    .default('private'),
  pqcPublicKeyRef: text('pqc_public_key_ref').notNull(),
  lgpdConsent: jsonb('lgpd_consent').notNull(),
  passwordHash: text('password_hash'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  userAccountId: uuid('user_account_id')
    .primaryKey()
    .references(() => userAccounts.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export type UserAccountRow = typeof userAccounts.$inferSelect;
export type NewUserAccountRow = typeof userAccounts.$inferInsert;
