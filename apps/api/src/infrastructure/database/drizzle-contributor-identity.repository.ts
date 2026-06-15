import { Inject, Injectable } from '@nestjs/common';
import {
  ContributorIdentity,
  type ContributorIdentityRepositoryPort,
} from '@sorriso-sentinel/domain';
import { contributors, withCityContext } from '@sorriso-sentinel/database';
import { eq, sql } from 'drizzle-orm';
import type pg from 'pg';
import { DATABASE_POOL } from './database.tokens';

@Injectable()
export class DrizzleContributorIdentityRepository
  implements ContributorIdentityRepositoryPort
{
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async save(identity: ContributorIdentity): Promise<void> {
    const props = identity.toProps();

    await withCityContext(this.pool, props.cityId, async (db) => {
      await db
        .insert(contributors)
        .values({
          id: props.id,
          cityId: props.cityId,
          reputationId: props.reputationId,
          identityMode: props.identityMode,
          pseudonym: props.pseudonym,
          publicProfileId: props.publicProfileId,
          localKeyRef: props.localKeyRef,
          version: props.version,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        })
        .onConflictDoUpdate({
          target: contributors.id,
          set: {
            identityMode: props.identityMode,
            pseudonym: props.pseudonym,
            publicProfileId: props.publicProfileId,
            localKeyRef: props.localKeyRef,
            version: props.version,
            updatedAt: props.updatedAt,
          },
        });
    });
  }

  async findById(
    id: string,
    cityId: string,
  ): Promise<ContributorIdentity | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(contributors)
        .where(eq(contributors.id, id))
        .limit(1);

      return rows[0] ? this.toIdentity(rows[0]) : null;
    });
  }

  async findByLocalKeyRef(
    localKeyRef: string,
    cityId: string,
  ): Promise<ContributorIdentity | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(contributors)
        .where(eq(contributors.localKeyRef, localKeyRef))
        .limit(1);

      return rows[0] ? this.toIdentity(rows[0]) : null;
    });
  }

  async findByPseudonym(
    pseudonym: string,
    cityId: string,
  ): Promise<ContributorIdentity | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(contributors)
        .where(sql`lower(${contributors.pseudonym}) = lower(${pseudonym})`)
        .limit(1);

      return rows[0] ? this.toIdentity(rows[0]) : null;
    });
  }

  async findByReputationId(
    reputationId: string,
    cityId: string,
  ): Promise<ContributorIdentity | null> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(contributors)
        .where(eq(contributors.reputationId, reputationId))
        .limit(1);

      return rows[0] ? this.toIdentity(rows[0]) : null;
    });
  }

  private toIdentity(row: typeof contributors.$inferSelect): ContributorIdentity {
    return ContributorIdentity.rehydrate({
      id: row.id,
      cityId: row.cityId,
      reputationId: row.reputationId,
      identityMode: row.identityMode as ContributorIdentity['identityMode'],
      pseudonym: row.pseudonym,
      publicProfileId: row.publicProfileId,
      localKeyRef: row.localKeyRef,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
