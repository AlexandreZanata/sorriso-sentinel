import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as authSchema from './schema/auth.js';
import * as contributorsSchema from './schema/contributors.js';
import * as occurrenceCommentsSchema from './schema/occurrence-comments.js';
import * as occurrencesSchema from './schema/occurrences.js';
import * as mediaAssetsSchema from './schema/media-assets.js';
import * as userAccountsSchema from './schema/user-accounts.js';
import * as validationVotesSchema from './schema/validation-votes.js';

export const schema = {
  ...contributorsSchema,
  ...occurrencesSchema,
  ...occurrenceCommentsSchema,
  ...validationVotesSchema,
  ...userAccountsSchema,
  ...authSchema,
  ...mediaAssetsSchema,
};

export type Database = NodePgDatabase<typeof schema>;

export function createDatabasePool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString });
}

export function createDatabase(client: pg.Pool | pg.PoolClient): Database {
  return drizzle(client, { schema });
}

export async function withCityContext<T>(
  pool: pg.Pool,
  cityId: string,
  operation: (db: Database) => Promise<T>,
  options?: { bypassSensitive?: boolean },
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.city_id', $1, true)`, [cityId]);

    if (options?.bypassSensitive) {
      await client.query(`SELECT set_config('app.bypass_sensitive', 'true', true)`);
    }

    const result = await operation(createDatabase(client));
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { contributors } from './schema/contributors.js';
export { occurrences } from './schema/occurrences.js';
export { occurrenceComments } from './schema/occurrence-comments.js';
export { validationVotes } from './schema/validation-votes.js';
export { userAccounts, emailVerificationTokens } from './schema/user-accounts.js';
export { refreshTokens, userAccountRoles } from './schema/auth.js';
export { mediaAssets } from './schema/media-assets.js';
