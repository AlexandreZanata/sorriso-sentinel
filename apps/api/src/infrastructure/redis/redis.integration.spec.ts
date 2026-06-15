import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import Redis from 'ioredis';
import { createTestApp, request } from '../../test/test-app';

const redisUrl = process.env.REDIS_URL;
const describeRedis = redisUrl ? describe : describe.skip;

describeRedis('Redis integration', () => {
  let app: INestApplication;
  let redis: Redis;
  const cityId = '01932f1a-0000-7000-8000-000000000001';

  beforeAll(async () => {
    app = await createTestApp();
    redis = new Redis(redisUrl!);
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.quit();
    await app.close();
  });

  it('should_report_redis_ok_on_ready', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready').expect(200);

    expect(response.body).toEqual({
      status: 'ready',
      redis: 'ok',
      postgres: 'disabled',
    });
  });

  it('should_persist_bootstrap_identity_in_redis', async () => {
    const localKeyRef = 'fingerprint-redis-persist';

    const response = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({ cityId, localKeyRef })
      .expect(201);

    const redisKey = `sentinel:contributor:local:${cityId}:${localKeyRef}`;
    const stored = await redis.get(redisKey);

    expect(stored).toBeTruthy();
    expect(stored).toContain(response.body.reputationId);
  });

  it('should_return_same_reputation_id_for_existing_local_key', async () => {
    const localKeyRef = 'fingerprint-redis-idempotent';

    const first = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({ cityId, localKeyRef })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({ cityId, localKeyRef })
      .expect(201);

    expect(second.body.reputationId).toBe(first.body.reputationId);
    expect(second.body.contributorId).toBe(first.body.contributorId);
  });

  it('should_return_429_when_create_occurrence_rate_limit_exceeded', async () => {
    const localKeyRef = 'fingerprint-rate-limit-create';
    const bootstrap = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({ cityId, localKeyRef })
      .expect(201);

    const token = bootstrap.body.sessionToken as string;

    for (let index = 0; index < 10; index += 1) {
      await request(app.getHttpServer())
        .post('/occurrences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'pothole',
          latitude: -12.5423 + index * 0.0001,
          longitude: -55.7214,
        })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(429);
  });
});
