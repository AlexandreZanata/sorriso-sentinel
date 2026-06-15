import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import type { RateLimiterPort, RateLimitResult } from './rate-limiter.port';
import { REDIS_CLIENT } from './redis.tokens';

@Injectable()
export class RedisRateLimiterService implements RateLimiterPort {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const redisKey = `sentinel:rl:${key}`;
    const count = await this.redis.incr(redisKey);

    if (count === 1) {
      await this.redis.expire(redisKey, windowSeconds);
    }

    const ttl = await this.redis.ttl(redisKey);
    const retryAfterSeconds = ttl > 0 ? ttl : windowSeconds;

    if (count > limit) {
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true, retryAfterSeconds };
  }
}
