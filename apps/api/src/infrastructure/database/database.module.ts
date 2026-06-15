import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  type OnModuleDestroy,
} from '@nestjs/common';
import { CONTRIBUTOR_IDENTITY_REPOSITORY } from '@sorriso-sentinel/domain';
import { createDatabasePool } from '@sorriso-sentinel/database';
import type pg from 'pg';
import { InMemoryContributorIdentityRepository } from '../identity/in-memory-contributor-identity.repository';
import {
  InMemoryOccurrenceStore,
  OCCURRENCE_STORE,
} from '../occurrences/in-memory-occurrence.store';
import { DrizzleOccurrenceEventPublisher } from '../occurrences/drizzle-occurrence-event.publisher';
import { InMemoryOccurrenceEventPublisher } from '../occurrences/in-memory-occurrence-event.publisher';
import { OCCURRENCE_EVENT_PUBLISHER } from '../occurrences/occurrence-event-publisher.port';
import { DATABASE_POOL } from './database.tokens';
import { DrizzleContributorIdentityRepository } from './drizzle-contributor-identity.repository';
import {
  DrizzleOccurrenceCommentStore,
  OCCURRENCE_COMMENT_STORE,
} from './drizzle-occurrence-comment.store';
import { DrizzleOccurrenceStore } from './drizzle-occurrence.store';
import { InMemoryOccurrenceIdGenerator } from './in-memory-occurrence-id.generator';
import { OCCURRENCE_ID_GENERATOR } from './occurrence-id-generator.port';
import { PostgresOccurrenceIdGenerator } from './postgres-occurrence-id.generator';

@Injectable()
class DatabaseConnection implements OnModuleDestroy {
  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool | null,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return {
        module: DatabaseModule,
        providers: [
          { provide: DATABASE_POOL, useValue: null },
          {
            provide: CONTRIBUTOR_IDENTITY_REPOSITORY,
            useClass: InMemoryContributorIdentityRepository,
          },
          { provide: OCCURRENCE_STORE, useClass: InMemoryOccurrenceStore },
          {
            provide: OCCURRENCE_COMMENT_STORE,
            useValue: {
              save: async () => undefined,
            },
          },
          {
            provide: OCCURRENCE_ID_GENERATOR,
            useClass: InMemoryOccurrenceIdGenerator,
          },
          {
            provide: OCCURRENCE_EVENT_PUBLISHER,
            useClass: InMemoryOccurrenceEventPublisher,
          },
        ],
        exports: [
          DATABASE_POOL,
          CONTRIBUTOR_IDENTITY_REPOSITORY,
          OCCURRENCE_STORE,
          OCCURRENCE_COMMENT_STORE,
          OCCURRENCE_ID_GENERATOR,
          OCCURRENCE_EVENT_PUBLISHER,
        ],
      };
    }

    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_POOL,
          useFactory: (): pg.Pool => createDatabasePool(databaseUrl),
        },
        DatabaseConnection,
        {
          provide: CONTRIBUTOR_IDENTITY_REPOSITORY,
          useClass: DrizzleContributorIdentityRepository,
        },
        { provide: OCCURRENCE_STORE, useClass: DrizzleOccurrenceStore },
        {
          provide: OCCURRENCE_COMMENT_STORE,
          useClass: DrizzleOccurrenceCommentStore,
        },
        {
          provide: OCCURRENCE_ID_GENERATOR,
          useClass: PostgresOccurrenceIdGenerator,
        },
        {
          provide: OCCURRENCE_EVENT_PUBLISHER,
          useClass: DrizzleOccurrenceEventPublisher,
        },
      ],
      exports: [
        DATABASE_POOL,
        CONTRIBUTOR_IDENTITY_REPOSITORY,
        OCCURRENCE_STORE,
        OCCURRENCE_COMMENT_STORE,
        OCCURRENCE_ID_GENERATOR,
        OCCURRENCE_EVENT_PUBLISHER,
      ],
    };
  }
}
