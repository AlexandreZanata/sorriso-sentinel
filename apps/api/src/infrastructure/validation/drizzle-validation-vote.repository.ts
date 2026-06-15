import { Inject, Injectable } from '@nestjs/common';
import {
  type ValidationVoteProps,
  type ValidationVoteRepositoryPort,
} from '@sorriso-sentinel/domain';
import { validationVotes, withCityContext } from '@sorriso-sentinel/database';
import { eq } from 'drizzle-orm';
import type pg from 'pg';
import { DATABASE_POOL } from '../database/database.tokens';

@Injectable()
export class DrizzleValidationVoteRepository
  implements ValidationVoteRepositoryPort
{
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async save(vote: ValidationVoteProps): Promise<void> {
    await withCityContext(this.pool, vote.cityId, async (db) => {
      await db.insert(validationVotes).values({
        id: vote.id,
        occurrenceId: vote.occurrenceId,
        cityId: vote.cityId,
        voterReputationId: vote.voterReputationId,
        voteType: vote.voteType,
        reason: vote.reason,
        trustWeightApplied: vote.trustWeightApplied,
        createdAt: vote.createdAt,
      });
    });
  }

  async findByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<ValidationVoteProps[]> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(validationVotes)
        .where(eq(validationVotes.occurrenceId, occurrenceId));

      return rows.map((row) => ({
        id: row.id,
        occurrenceId: row.occurrenceId,
        cityId: row.cityId,
        voterReputationId: row.voterReputationId,
        voteType: row.voteType as ValidationVoteProps['voteType'],
        reason: row.reason,
        trustWeightApplied: row.trustWeightApplied,
        createdAt: row.createdAt,
      }));
    });
  }
}

export class InMemoryValidationVoteRepository
  implements ValidationVoteRepositoryPort
{
  private readonly votes: ValidationVoteProps[] = [];

  async save(vote: ValidationVoteProps): Promise<void> {
    this.votes.push(vote);
  }

  async findByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<ValidationVoteProps[]> {
    return this.votes.filter(
      (vote) =>
        vote.occurrenceId === occurrenceId && vote.cityId === cityId,
    );
  }
}
