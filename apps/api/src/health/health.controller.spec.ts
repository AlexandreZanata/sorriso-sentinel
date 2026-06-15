import { describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DATABASE_POOL } from '../infrastructure/database/database.tokens';
import { REDIS_HEALTH } from '../infrastructure/redis/redis.tokens';

describe('HealthController', () => {
  it('should_return_ok', () => {
    const controller = new HealthController(
      { ping: async () => true } as never,
      null,
    );

    expect(controller.getHealth()).toEqual({ status: 'ok' });
    expect(controller.getLive()).toEqual({ status: 'live' });
  });

  it('should_return_ready_with_services_disabled_when_env_missing', async () => {
    const previousRedis = process.env.REDIS_URL;
    delete process.env.REDIS_URL;

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: REDIS_HEALTH, useValue: { ping: async () => false } },
        { provide: DATABASE_POOL, useValue: null },
      ],
    }).compile();

    const controller = moduleRef.get(HealthController);
    await expect(controller.getReady()).resolves.toEqual({
      status: 'ready',
      redis: 'disabled',
      postgres: 'disabled',
    });

    process.env.REDIS_URL = previousRedis;
  });
});
