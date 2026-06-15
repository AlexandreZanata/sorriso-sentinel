import { refreshTokens, withCityContext } from '@sorriso-sentinel/database';
import type pg from 'pg';
import type {
  RefreshTokenStorePort,
  StoredRefreshToken,
} from './refresh-token.store.port';

export class DrizzleRefreshTokenStore implements RefreshTokenStorePort {
  constructor(private readonly pool: pg.Pool) {}

  async save(token: StoredRefreshToken): Promise<void> {
    await withCityContext(this.pool, token.cityId, async (db) => {
      await db.insert(refreshTokens).values({
        id: token.id,
        cityId: token.cityId,
        userAccountId: token.userAccountId,
        tokenHash: token.tokenHash,
        familyId: token.familyId,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
      });
    });
  }

  async findByTokenHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query<{
        id: string;
        city_id: string;
        user_account_id: string;
        token_hash: string;
        family_id: string;
        expires_at: Date;
        revoked_at: Date | null;
      }>(
        `SELECT id, city_id, user_account_id, token_hash, family_id, expires_at, revoked_at
         FROM refresh_tokens
         WHERE token_hash = $1
         LIMIT 1`,
        [tokenHash],
      );

      const row = result.rows[0];

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        cityId: row.city_id,
        userAccountId: row.user_account_id,
        tokenHash: row.token_hash,
        familyId: row.family_id,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
      };
    } finally {
      client.release();
    }
  }

  async revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `UPDATE refresh_tokens SET revoked_at = $2 WHERE token_hash = $1`,
        [tokenHash, revokedAt],
      );
    } finally {
      client.release();
    }
  }

  async revokeFamily(familyId: string, revokedAt: Date): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `UPDATE refresh_tokens SET revoked_at = $2 WHERE family_id = $1 AND revoked_at IS NULL`,
        [familyId, revokedAt],
      );
    } finally {
      client.release();
    }
  }
}

export class InMemoryRefreshTokenStore implements RefreshTokenStorePort {
  private readonly tokens = new Map<string, StoredRefreshToken>();

  async save(token: StoredRefreshToken): Promise<void> {
    this.tokens.set(token.tokenHash, { ...token });
  }

  async findByTokenHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const token = this.tokens.get(tokenHash);
    return token ? { ...token } : null;
  }

  async revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<void> {
    const token = this.tokens.get(tokenHash);

    if (token) {
      this.tokens.set(tokenHash, { ...token, revokedAt });
    }
  }

  async revokeFamily(familyId: string, revokedAt: Date): Promise<void> {
    for (const [hash, token] of this.tokens.entries()) {
      if (token.familyId === familyId && !token.revokedAt) {
        this.tokens.set(hash, { ...token, revokedAt });
      }
    }
  }
}
