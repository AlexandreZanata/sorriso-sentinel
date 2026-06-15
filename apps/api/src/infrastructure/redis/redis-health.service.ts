import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.tokens';

@Injectable()
export class RedisHealthService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis | null,
  ) {}

  async ping(): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const response = await this.redis.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }
}
