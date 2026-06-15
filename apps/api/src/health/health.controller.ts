import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { REDIS_HEALTH } from '../infrastructure/redis/redis.tokens';
import { RedisHealthService } from '../infrastructure/redis/redis-health.service';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(REDIS_HEALTH)
    private readonly redisHealth: RedisHealthService,
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
  async getReady(): Promise<{ status: string; redis: string }> {
    const redisConfigured = process.env.REDIS_URL !== undefined;

    if (redisConfigured) {
      const redisOk = await this.redisHealth.ping();

      if (!redisOk) {
        throw new ServiceUnavailableException({
          status: 'not_ready',
          redis: 'unavailable',
        });
      }

      return { status: 'ready', redis: 'ok' };
    }

    return { status: 'ready', redis: 'disabled' };
  }
}
