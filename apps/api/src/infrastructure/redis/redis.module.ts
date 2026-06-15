import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  type OnModuleDestroy,
} from '@nestjs/common';
import { CONTRIBUTOR_IDENTITY_REPOSITORY } from '@sorriso-sentinel/domain';
import Redis from 'ioredis';
import { InMemoryContributorIdentityRepository } from '../identity/in-memory-contributor-identity.repository';
import { NoOpRateLimiter } from './no-op-rate-limiter.service';
import { RedisContributorIdentityRepository } from './redis-contributor-identity.repository';
import { RedisHealthService } from './redis-health.service';
import { RedisRateLimiterService } from './redis-rate-limiter.service';
import { REDIS_CLIENT, REDIS_HEALTH, REDIS_RATE_LIMITER } from './redis.tokens';

@Injectable()
class RedisConnection implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly client: Redis | null,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

@Global()
@Module({})
export class RedisModule {
  static forRoot(): DynamicModule {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      return {
        module: RedisModule,
        providers: [
          { provide: REDIS_CLIENT, useValue: null },
          { provide: REDIS_HEALTH, useClass: RedisHealthService },
          { provide: REDIS_RATE_LIMITER, useClass: NoOpRateLimiter },
          {
            provide: CONTRIBUTOR_IDENTITY_REPOSITORY,
            useClass: InMemoryContributorIdentityRepository,
          },
        ],
        exports: [
          REDIS_CLIENT,
          REDIS_HEALTH,
          REDIS_RATE_LIMITER,
          CONTRIBUTOR_IDENTITY_REPOSITORY,
        ],
      };
    }

    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_CLIENT,
          useFactory: async (): Promise<Redis> => {
            const client = new Redis(redisUrl, {
              maxRetriesPerRequest: 1,
              lazyConnect: true,
            });
            await client.connect();
            return client;
          },
        },
        RedisConnection,
        { provide: REDIS_HEALTH, useClass: RedisHealthService },
        { provide: REDIS_RATE_LIMITER, useClass: RedisRateLimiterService },
        {
          provide: CONTRIBUTOR_IDENTITY_REPOSITORY,
          useClass: RedisContributorIdentityRepository,
        },
      ],
      exports: [
        REDIS_CLIENT,
        REDIS_HEALTH,
        REDIS_RATE_LIMITER,
        CONTRIBUTOR_IDENTITY_REPOSITORY,
      ],
    };
  }
}
