import { Inject, Injectable } from '@nestjs/common';
import {
  occurrenceComments,
  withCityContext,
} from '@sorriso-sentinel/database';
import { and, asc, eq, isNull } from 'drizzle-orm';
import type pg from 'pg';
import { DATABASE_POOL } from './database.tokens';

export interface StoredComment {
  id: string;
  occurrenceId: string;
  cityId: string;
  authorReputationId: string;
  parentCommentId?: string;
  text: string;
  authorDisplayPolicy: string;
  createdAt: Date;
}

export interface OccurrenceCommentStorePort {
  save(comment: StoredComment): Promise<void>;
  listByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<StoredComment[]>;
}

export const OCCURRENCE_COMMENT_STORE = Symbol('OCCURRENCE_COMMENT_STORE');

@Injectable()
export class InMemoryOccurrenceCommentStore implements OccurrenceCommentStorePort {
  private readonly comments: StoredComment[] = [];

  async save(comment: StoredComment): Promise<void> {
    this.comments.push({ ...comment });
  }

  async listByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<StoredComment[]> {
    return this.comments
      .filter(
        (comment) =>
          comment.occurrenceId === occurrenceId && comment.cityId === cityId,
      )
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((comment) => ({ ...comment }));
  }
}

@Injectable()
export class DrizzleOccurrenceCommentStore implements OccurrenceCommentStorePort {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async save(comment: StoredComment): Promise<void> {
    await withCityContext(this.pool, comment.cityId, async (db) => {
      await db.insert(occurrenceComments).values({
        id: comment.id,
        occurrenceId: comment.occurrenceId,
        cityId: comment.cityId,
        authorReputationId: comment.authorReputationId,
        parentCommentId: comment.parentCommentId,
        text: comment.text,
        authorDisplayPolicy: comment.authorDisplayPolicy,
        createdAt: comment.createdAt,
      });
    });
  }

  async listByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<StoredComment[]> {
    return withCityContext(this.pool, cityId, async (db) => {
      const rows = await db
        .select()
        .from(occurrenceComments)
        .where(
          and(
            eq(occurrenceComments.occurrenceId, occurrenceId),
            isNull(occurrenceComments.deletedAt),
          ),
        )
        .orderBy(asc(occurrenceComments.createdAt));

      return rows.map((row) => ({
        id: row.id,
        occurrenceId: row.occurrenceId,
        cityId: row.cityId,
        authorReputationId: row.authorReputationId,
        parentCommentId: row.parentCommentId ?? undefined,
        text: row.text,
        authorDisplayPolicy: row.authorDisplayPolicy,
        createdAt: row.createdAt,
      }));
    });
  }
}
