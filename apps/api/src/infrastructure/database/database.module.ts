import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  type OnModuleDestroy,
} from '@nestjs/common';
import {
  ABUSE_SIGNAL_PORT,
  CONTRIBUTOR_IDENTITY_REPOSITORY,
  PQC_CRYPTO_PORT,
  USER_ACCOUNT_REPOSITORY,
  VALIDATION_VOTE_REPOSITORY,
} from '@sorriso-sentinel/domain';
import { createDatabasePool } from '@sorriso-sentinel/database';
import type pg from 'pg';
import { DevPqcCryptoService } from '../crypto/dev-pqc-crypto.service';
import {
  DrizzleUserAccountRepository,
  InMemoryUserAccountRepository,
} from './drizzle-user-account.repository';
import { InMemoryContributorIdentityRepository } from '../identity/in-memory-contributor-identity.repository';
import {
  InMemoryAbuseSignalService,
  RedisAbuseSignalService,
} from '../identity/redis-abuse-signal.service';
import {
  InMemoryOccurrenceStore,
  OCCURRENCE_STORE,
} from '../occurrences/in-memory-occurrence.store';
import { DrizzleOccurrenceEventPublisher } from '../occurrences/drizzle-occurrence-event.publisher';
import { InMemoryOccurrenceEventPublisher } from '../occurrences/in-memory-occurrence-event.publisher';
import { OCCURRENCE_EVENT_PUBLISHER } from '../occurrences/occurrence-event-publisher.port';
import {
  REPUTATION_PORT,
  StubReputationPort,
} from '../reputation/stub-reputation.port';
import {
  DrizzleValidationVoteRepository,
  InMemoryValidationVoteRepository,
} from '../validation/drizzle-validation-vote.repository';
import { DATABASE_POOL } from './database.tokens';
import { DrizzleContributorIdentityRepository } from './drizzle-contributor-identity.repository';
import {
  DrizzleOccurrenceCommentStore,
  InMemoryOccurrenceCommentStore,
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
            useClass: InMemoryOccurrenceCommentStore,
          },
          {
            provide: OCCURRENCE_ID_GENERATOR,
            useClass: InMemoryOccurrenceIdGenerator,
          },
          {
            provide: OCCURRENCE_EVENT_PUBLISHER,
            useClass: InMemoryOccurrenceEventPublisher,
          },
          {
            provide: VALIDATION_VOTE_REPOSITORY,
            useClass: InMemoryValidationVoteRepository,
          },
          {
            provide: USER_ACCOUNT_REPOSITORY,
            useClass: InMemoryUserAccountRepository,
          },
          { provide: ABUSE_SIGNAL_PORT, useClass: InMemoryAbuseSignalService },
          { provide: PQC_CRYPTO_PORT, useClass: DevPqcCryptoService },
          { provide: REPUTATION_PORT, useClass: StubReputationPort },
        ],
        exports: [
          DATABASE_POOL,
          CONTRIBUTOR_IDENTITY_REPOSITORY,
          OCCURRENCE_STORE,
          OCCURRENCE_COMMENT_STORE,
          OCCURRENCE_ID_GENERATOR,
          OCCURRENCE_EVENT_PUBLISHER,
          VALIDATION_VOTE_REPOSITORY,
          USER_ACCOUNT_REPOSITORY,
          ABUSE_SIGNAL_PORT,
          PQC_CRYPTO_PORT,
          REPUTATION_PORT,
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
        {
          provide: VALIDATION_VOTE_REPOSITORY,
          useClass: DrizzleValidationVoteRepository,
        },
        {
          provide: USER_ACCOUNT_REPOSITORY,
          useClass: DrizzleUserAccountRepository,
        },
        { provide: ABUSE_SIGNAL_PORT, useClass: RedisAbuseSignalService },
        { provide: PQC_CRYPTO_PORT, useClass: DevPqcCryptoService },
        { provide: REPUTATION_PORT, useClass: StubReputationPort },
      ],
      exports: [
        DATABASE_POOL,
        CONTRIBUTOR_IDENTITY_REPOSITORY,
        OCCURRENCE_STORE,
        OCCURRENCE_COMMENT_STORE,
        OCCURRENCE_ID_GENERATOR,
        OCCURRENCE_EVENT_PUBLISHER,
        VALIDATION_VOTE_REPOSITORY,
        USER_ACCOUNT_REPOSITORY,
        ABUSE_SIGNAL_PORT,
        PQC_CRYPTO_PORT,
        REPUTATION_PORT,
      ],
    };
  }
}
