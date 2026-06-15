import { Inject, Injectable } from '@nestjs/common';
import type { AbuseSignalPort } from '@sorriso-sentinel/domain';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.tokens';

@Injectable()
export class RedisAbuseSignalService implements AbuseSignalPort {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis | null,
  ) {}

  async isDeviceAlreadyRegistered(
    cityId: string,
    deviceBindingDigest: string,
  ): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    const key = `device:${cityId}:${deviceBindingDigest}`;
    const value = await this.redis.get(key);
    return value !== null;
  }

  async registerDeviceBinding(
    cityId: string,
    deviceBindingDigest: string,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.redis) {
      return;
    }

    const key = `device:${cityId}:${deviceBindingDigest}`;
    await this.redis.set(key, '1', 'EX', ttlSeconds);
  }
}

export class InMemoryAbuseSignalService implements AbuseSignalPort {
  private readonly bindings = new Set<string>();

  async isDeviceAlreadyRegistered(
    cityId: string,
    deviceBindingDigest: string,
  ): Promise<boolean> {
    return this.bindings.has(`${cityId}:${deviceBindingDigest}`);
  }

  async registerDeviceBinding(
    cityId: string,
    deviceBindingDigest: string,
    _ttlSeconds: number,
  ): Promise<void> {
    this.bindings.add(`${cityId}:${deviceBindingDigest}`);
  }
}
