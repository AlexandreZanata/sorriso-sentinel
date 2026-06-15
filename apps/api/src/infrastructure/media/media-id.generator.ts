import { Inject, Injectable } from '@nestjs/common';
import type { MediaIdGeneratorPort } from './media-id-generator.port';
import { DATABASE_POOL } from '../database/database.tokens';
import type pg from 'pg';

@Injectable()
export class PostgresMediaIdGenerator implements MediaIdGeneratorPort {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool,
  ) {}

  async generate(): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      'SELECT uuidv7()::text AS id',
    );

    return result.rows[0]!.id;
  }
}

@Injectable()
export class InMemoryMediaIdGenerator implements MediaIdGeneratorPort {
  private counter = 0;

  async generate(): Promise<string> {
    this.counter += 1;
    return `01932f1a-0000-7000-8000-${String(this.counter).padStart(12, '0')}`;
  }
}
