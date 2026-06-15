import { Injectable } from '@nestjs/common';
import type { RateLimiterPort, RateLimitResult } from './rate-limiter.port';

@Injectable()
export class NoOpRateLimiter implements RateLimiterPort {
  async consume(): Promise<RateLimitResult> {
    return { allowed: true };
  }
}
