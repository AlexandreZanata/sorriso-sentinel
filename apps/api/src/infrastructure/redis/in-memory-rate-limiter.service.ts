import { Injectable } from '@nestjs/common';
import type { RateLimiterPort, RateLimitResult } from './rate-limiter.port';

@Injectable()
export class InMemoryRateLimiter implements RateLimiterPort {
  private readonly counts = new Map<string, number>();

  async consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const nextCount = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, nextCount);

    if (nextCount > limit) {
      return { allowed: false, retryAfterSeconds: windowSeconds };
    }

    return { allowed: true };
  }
}
