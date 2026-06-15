import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_PROFILE_PHOTO_VISIBILITY,
  type EmailVerificationTokenRecord,
  type UserAccountProps,
  type UserAccountRepositoryPort,
} from '@sorriso-sentinel/domain';
import {
  emailVerificationTokens,
  userAccountRoles,
  userAccounts,
  withCityContext,
} from '@sorriso-sentinel/database';
import { and, eq } from 'drizzle-orm';
import type pg from 'pg';
import { DATABASE_POOL } from '../database/database.tokens';

@Injectable()
export class DrizzleUserAccountRepository implements UserAccountRepositoryPort {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async save(account: UserAccountProps): Promise<void> {
    await withCityContext(this.pool, account.cityId, async (db) => {
      await db
        .insert(userAccounts)
        .values({
          id: account.id,
          cityId: account.cityId,
          contributorId: account.contributorId,
          emailNormalized: account.email.toLowerCase(),
          emailCiphertext: Buffer.from(account.email).toString('base64url'),
          displayName: account.displayName,
          status: account.status,
          emailVerificationState: account.emailVerificationState,
          showIdentityOnReports: account.showIdentityOnReports,
          profilePhotoStorageKey: account.profilePhotoStorageKey,
          profilePhotoVisibility: account.profilePhotoVisibility,
          pqcPublicKeyRef: account.pqcPublicKeyRef,
          lgpdConsent: account.lgpdConsent,
          version: account.version,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          deletedAt: account.deletedAt,
        })
        .onConflictDoUpdate({
          target: userAccounts.id,
          set: {
            displayName: account.displayName,
            status: account.status,
            emailVerificationState: account.emailVerificationState,
            showIdentityOnReports: account.showIdentityOnReports,
            profilePhotoStorageKey: account.profilePhotoStorageKey,
            profilePhotoVisibility: account.profilePhotoVisibility,
            lgpdConsent: account.lgpdConsent,
            version: account.version,
            updatedAt: account.updatedAt,
            deletedAt: account.deletedAt,
            emailNormalized: account.email.toLowerCase(),
            emailCiphertext: Buffer.from(account.email).toString('base64url'),
          },
        });
    });
  }

  async findById(
    cityId: string,
    id: string,
  ): Promise<UserAccountProps | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(userAccounts)
        .where(and(eq(userAccounts.id, id), eq(userAccounts.cityId, cityId)))
        .limit(1);

      return rows[0] ? this.toProps(rows[0]) : null;
    });
  }

  async findByEmail(
    cityId: string,
    email: string,
  ): Promise<UserAccountProps | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(userAccounts)
        .where(
          and(
            eq(userAccounts.cityId, cityId),
            eq(userAccounts.emailNormalized, email.toLowerCase()),
          ),
        )
        .limit(1);

      return rows[0] ? this.toProps(rows[0]) : null;
    });
  }

  async findByContributorId(
    cityId: string,
    contributorId: string,
  ): Promise<UserAccountProps | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(userAccounts)
        .where(
          and(
            eq(userAccounts.cityId, cityId),
            eq(userAccounts.contributorId, contributorId),
          ),
        )
        .limit(1);

      return rows[0] ? this.toProps(rows[0]) : null;
    });
  }

  async setPasswordHash(
    cityId: string,
    userAccountId: string,
    passwordHash: string,
  ): Promise<void> {
    await withCityContext(this.pool, cityId, async (db) => {
      await db
        .update(userAccounts)
        .set({ passwordHash, updatedAt: new Date() })
        .where(
          and(
            eq(userAccounts.id, userAccountId),
            eq(userAccounts.cityId, cityId),
          ),
        );
    });
  }

  async findPasswordHash(
    cityId: string,
    userAccountId: string,
  ): Promise<string | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select({ passwordHash: userAccounts.passwordHash })
        .from(userAccounts)
        .where(
          and(
            eq(userAccounts.id, userAccountId),
            eq(userAccounts.cityId, cityId),
          ),
        )
        .limit(1);

      return rows[0]?.passwordHash ?? null;
    });
  }

  async listRoles(cityId: string, userAccountId: string): Promise<string[]> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select({ role: userAccountRoles.role })
        .from(userAccountRoles)
        .where(
          and(
            eq(userAccountRoles.cityId, cityId),
            eq(userAccountRoles.userAccountId, userAccountId),
          ),
        );

      return rows.map((row) => row.role);
    });
  }

  async grantRole(
    cityId: string,
    userAccountId: string,
    role: string,
  ): Promise<void> {
    await withCityContext(this.pool, cityId, async (db) => {
      await db
        .insert(userAccountRoles)
        .values({
          userAccountId,
          cityId,
          role,
        })
        .onConflictDoNothing();
    });
  }

  async saveVerificationToken(
    userAccountId: string,
    record: EmailVerificationTokenRecord,
  ): Promise<void> {
    const account = await this.findAccountCity(userAccountId);

    if (!account) {
      return;
    }

    await withCityContext(this.pool, account.cityId, async (db) => {
      await db
        .insert(emailVerificationTokens)
        .values({
          userAccountId,
          tokenHash: record.tokenHash,
          issuedAt: record.issuedAt,
          expiresAt: record.expiresAt,
        })
        .onConflictDoUpdate({
          target: emailVerificationTokens.userAccountId,
          set: {
            tokenHash: record.tokenHash,
            issuedAt: record.issuedAt,
            expiresAt: record.expiresAt,
          },
        });
    });
  }

  async findVerificationToken(
    userAccountId: string,
  ): Promise<EmailVerificationTokenRecord | null> {
    const account = await this.findAccountCity(userAccountId);

    if (!account) {
      return null;
    }

    return withCityContext(this.pool, account.cityId, async (db) => {
      const rows = await db
        .select()
        .from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.userAccountId, userAccountId))
        .limit(1);
      const row = rows[0];

      if (!row) {
        return null;
      }

      return {
        tokenHash: row.tokenHash,
        issuedAt: row.issuedAt,
        expiresAt: row.expiresAt,
      };
    });
  }

  async deleteVerificationToken(userAccountId: string): Promise<void> {
    const account = await this.findAccountCity(userAccountId);

    if (!account) {
      return;
    }

    await withCityContext(this.pool, account.cityId, async (db) => {
      await db
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.userAccountId, userAccountId));
    });
  }

  private async findAccountCity(
    userAccountId: string,
  ): Promise<{ cityId: string } | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query<{ city_id: string }>(
        'SELECT city_id FROM user_accounts WHERE id = $1 LIMIT 1',
        [userAccountId],
      );

      const row = result.rows[0];
      return row ? { cityId: row.city_id } : null;
    } finally {
      client.release();
    }
  }

  private toProps(row: typeof userAccounts.$inferSelect): UserAccountProps {
    const lgpdConsent = row.lgpdConsent as UserAccountProps['lgpdConsent'] & {
      consentedAt: string | Date;
    };

    return {
      id: row.id,
      cityId: row.cityId,
      contributorId: row.contributorId,
      email: Buffer.from(row.emailCiphertext, 'base64url').toString('utf8'),
      displayName: row.displayName,
      status: row.status as UserAccountProps['status'],
      emailVerificationState:
        row.emailVerificationState as UserAccountProps['emailVerificationState'],
      showIdentityOnReports: row.showIdentityOnReports,
      profilePhotoStorageKey: row.profilePhotoStorageKey,
      profilePhotoVisibility:
        (row.profilePhotoVisibility as UserAccountProps['profilePhotoVisibility']) ??
        DEFAULT_PROFILE_PHOTO_VISIBILITY,
      pqcPublicKeyRef: row.pqcPublicKeyRef,
      lgpdConsent: {
        termsVersion: lgpdConsent.termsVersion,
        privacyVersion: lgpdConsent.privacyVersion,
        consentedAt: new Date(lgpdConsent.consentedAt),
        purposes: [...lgpdConsent.purposes],
      },
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}

export class InMemoryUserAccountRepository implements UserAccountRepositoryPort {
  private readonly accounts = new Map<string, UserAccountProps>();
  private readonly tokens = new Map<string, EmailVerificationTokenRecord>();
  private readonly passwordHashes = new Map<string, string>();
  private readonly roles = new Map<string, Set<string>>();

  private roleKey(cityId: string, userAccountId: string): string {
    return `${cityId}:${userAccountId}`;
  }

  async save(account: UserAccountProps): Promise<void> {
    this.accounts.set(account.id, { ...account });
  }

  async findById(
    cityId: string,
    id: string,
  ): Promise<UserAccountProps | null> {
    const account = this.accounts.get(id);
    return account && account.cityId === cityId ? { ...account } : null;
  }

  async findByEmail(
    cityId: string,
    email: string,
  ): Promise<UserAccountProps | null> {
    for (const account of this.accounts.values()) {
      if (
        account.cityId === cityId &&
        account.email.toLowerCase() === email.toLowerCase()
      ) {
        return { ...account };
      }
    }

    return null;
  }

  async findByContributorId(
    cityId: string,
    contributorId: string,
  ): Promise<UserAccountProps | null> {
    for (const account of this.accounts.values()) {
      if (
        account.cityId === cityId &&
        account.contributorId === contributorId
      ) {
        return { ...account };
      }
    }

    return null;
  }

  async setPasswordHash(
    cityId: string,
    userAccountId: string,
    passwordHash: string,
  ): Promise<void> {
    this.passwordHashes.set(this.roleKey(cityId, userAccountId), passwordHash);
  }

  async findPasswordHash(
    cityId: string,
    userAccountId: string,
  ): Promise<string | null> {
    return this.passwordHashes.get(this.roleKey(cityId, userAccountId)) ?? null;
  }

  async listRoles(cityId: string, userAccountId: string): Promise<string[]> {
    return [...(this.roles.get(this.roleKey(cityId, userAccountId)) ?? [])];
  }

  async grantRole(
    cityId: string,
    userAccountId: string,
    role: string,
  ): Promise<void> {
    const key = this.roleKey(cityId, userAccountId);
    const current = this.roles.get(key) ?? new Set<string>();
    current.add(role);
    this.roles.set(key, current);
  }

  async saveVerificationToken(
    userAccountId: string,
    record: EmailVerificationTokenRecord,
  ): Promise<void> {
    this.tokens.set(userAccountId, { ...record });
  }

  async findVerificationToken(
    userAccountId: string,
  ): Promise<EmailVerificationTokenRecord | null> {
    const token = this.tokens.get(userAccountId);
    return token ? { ...token } : null;
  }

  async deleteVerificationToken(userAccountId: string): Promise<void> {
    this.tokens.delete(userAccountId);
  }
}
