import { Inject, Injectable } from '@nestjs/common';
import {
  occurrenceComments,
  withCityContext,
} from '@sorriso-sentinel/database';
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
}

export const OCCURRENCE_COMMENT_STORE = Symbol('OCCURRENCE_COMMENT_STORE');

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
}
