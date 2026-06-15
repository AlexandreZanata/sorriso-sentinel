import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import type pg from 'pg';
import { DATABASE_POOL } from '../infrastructure/database/database.tokens';
import { REDIS_HEALTH } from '../infrastructure/redis/redis.tokens';
import { RedisHealthService } from '../infrastructure/redis/redis-health.service';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(REDIS_HEALTH)
    private readonly redisHealth: RedisHealthService,
    @Inject(DATABASE_POOL)
    private readonly pool: pg.Pool | null,
  ) {}

  @Get()
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('live')
  getLive(): { status: string } {
    return { status: 'live' };
  }

  @Get('ready')
  async getReady(): Promise<{
    status: string;
    redis: string;
    postgres: string;
  }> {
    let redisStatus = 'disabled';

    if (process.env.REDIS_URL) {
      const redisOk = await this.redisHealth.ping();

      if (!redisOk) {
        throw new ServiceUnavailableException({
          status: 'not_ready',
          redis: 'unavailable',
        });
      }

      redisStatus = 'ok';
    }

    let postgresStatus = 'disabled';

    if (this.pool) {
      try {
        await this.pool.query('SELECT 1');
        postgresStatus = 'ok';
      } catch {
        throw new ServiceUnavailableException({
          status: 'not_ready',
          postgres: 'unavailable',
        });
      }
    }

    return {
      status: 'ready',
      redis: redisStatus,
      postgres: postgresStatus,
    };
  }
}
