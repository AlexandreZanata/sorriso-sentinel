import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type { OccurrenceIdGeneratorPort } from './occurrence-id-generator.port';
import { DATABASE_POOL } from './database.tokens';

@Injectable()
export class PostgresOccurrenceIdGenerator implements OccurrenceIdGeneratorPort {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async generate(): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      'SELECT uuidv7() AS id',
    );
    const id = result.rows[0]?.id;

    if (!id) {
      throw new Error('PostgreSQL uuidv7() returned no value');
    }

    return id;
  }
}
