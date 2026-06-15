import { describe, expect, it, vi } from 'vitest';
import type Redis from 'ioredis';
import { RedisRateLimiterService } from './redis-rate-limiter.service';

function createMockRedis(initial: Record<string, number> = {}): Redis {
  const counters = new Map<string, number>(Object.entries(initial));
  const ttls = new Map<string, number>();

  return {
    incr: vi.fn(async (key: string) => {
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return next;
    }),
    expire: vi.fn(async (key: string, seconds: number) => {
      ttls.set(key, seconds);
      return 1;
    }),
    ttl: vi.fn(async (key: string) => ttls.get(key) ?? 3600),
  } as unknown as Redis;
}

describe('RedisRateLimiterService', () => {
  it('should_allow_requests_under_limit', async () => {
    const limiter = new RedisRateLimiterService(createMockRedis());

    const result = await limiter.consume('occurrence:Rep-TEST1', 10, 3600);

    expect(result.allowed).toBe(true);
  });

  it('should_block_requests_over_limit', async () => {
    const limiter = new RedisRateLimiterService(
      createMockRedis({ 'sentinel:rl:occurrence:Rep-TEST1': 10 }),
    );

    const result = await limiter.consume('occurrence:Rep-TEST1', 10, 3600);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});
