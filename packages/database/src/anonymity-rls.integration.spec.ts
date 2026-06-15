import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  contributors,
  createDatabasePool,
  occurrences,
  withCityContext,
} from './client.js';

const databaseUrl = process.env.DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Anonymity RLS integration', () => {
  const cityA = '01932f1a-0000-7000-8000-000000000001';
  const cityB = '01932f1a-0000-7000-8000-000000000002';
  const contributorA = '01932f1a-0000-7000-8000-000000000011';
  const contributorB = '01932f1a-0000-7000-8000-000000000012';
  const sensitiveOccurrenceId = '01932f1a-0000-7000-8000-000000000021';
  const publicOccurrenceId = '01932f1a-0000-7000-8000-000000000022';

  let pool: ReturnType<typeof createDatabasePool>;

  beforeAll(async () => {
    pool = createDatabasePool(databaseUrl!);

    await withCityContext(pool, cityA, async (db) => {
      await db.insert(contributors).values({
        id: contributorA,
        cityId: cityA,
        reputationId: 'rep-city-a',
        identityMode: 'ghost',
        localKeyRef: 'fingerprint-city-a-rls',
      });
    });

    await withCityContext(pool, cityB, async (db) => {
      await db.insert(contributors).values({
        id: contributorB,
        cityId: cityB,
        reputationId: 'rep-city-b',
        identityMode: 'ghost',
        localKeyRef: 'fingerprint-city-b-rls',
      });
    });

    await withCityContext(pool, cityA, async (db) => {
      await db.insert(occurrences).values({
        id: sensitiveOccurrenceId,
        cityId: cityA,
        category: 'crime',
        status: 'unverified',
        confidenceLevel: 0,
        latitude: -12.5423,
        longitude: -55.7214,
        privacyLevel: 'public',
        contributorReputationId: 'rep-city-a',
        occurrenceKind: 'problem',
        isSensitive: true,
        authorDisplayPolicy: 'forced_ghost',
      });

      await db.insert(occurrences).values({
        id: publicOccurrenceId,
        cityId: cityA,
        category: 'pothole',
        status: 'unverified',
        confidenceLevel: 0,
        latitude: -12.5424,
        longitude: -55.7215,
        privacyLevel: 'public',
        contributorReputationId: 'rep-city-a',
        occurrenceKind: 'problem',
        isSensitive: false,
        authorDisplayPolicy: 'ghost',
      });
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should_enforce_city_id_rls_on_contributors_table', async () => {
    const cityARows = await withCityContext(pool, cityA, async (db) =>
      db.select().from(contributors),
    );
    const cityBRows = await withCityContext(pool, cityB, async (db) =>
      db.select().from(contributors),
    );

    expect(cityARows.some((row) => row.id === contributorA)).toBe(true);
    expect(cityARows.some((row) => row.id === contributorB)).toBe(false);
    expect(cityBRows.some((row) => row.id === contributorB)).toBe(true);
    expect(cityBRows.some((row) => row.id === contributorA)).toBe(false);
  });

  it('should_hide_contributor_ref_on_sensitive_occurrence_via_rls', async () => {
    const defaultRows = await withCityContext(pool, cityA, async (db) =>
      db.select().from(occurrences),
    );
    const bypassRows = await withCityContext(
      pool,
      cityA,
      async (db) => db.select().from(occurrences),
      { bypassSensitive: true },
    );

    const visibleIds = defaultRows.map((row) => row.id);
    const bypassIds = bypassRows.map((row) => row.id);

    expect(visibleIds).toContain(publicOccurrenceId);
    expect(visibleIds).not.toContain(sensitiveOccurrenceId);
    expect(bypassIds).toContain(sensitiveOccurrenceId);
    expect(bypassIds).toContain(publicOccurrenceId);
  });

  it('should_not_have_contributor_gps_column_on_occurrences', async () => {
    const result = await pool.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'occurrences'
         AND column_name LIKE '%contributor%gps%'`,
    );

    expect(result.rows).toHaveLength(0);
  });
});
