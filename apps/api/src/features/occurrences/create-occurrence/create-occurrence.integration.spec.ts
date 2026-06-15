import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../../app.module';
import { isUuidV7 } from '../../../infrastructure/id/uuid-v7-format';
import { OCCURRENCE_STORE } from '../../../infrastructure/occurrences/in-memory-occurrence.store';
import type { OccurrenceStorePort } from '../../../infrastructure/occurrences/in-memory-occurrence.store';
import { InMemoryRateLimiter } from '../../../infrastructure/redis/in-memory-rate-limiter.service';
import { REDIS_RATE_LIMITER } from '../../../infrastructure/redis/redis.tokens';
import { createTestApp, request } from '../../../test/test-app';

describe('Create occurrence integration', () => {
  let app: INestApplication;
  let occurrenceStore: OccurrenceStorePort;
  const cityId = '01932f1a-0000-7000-8000-000000000001';

  beforeAll(async () => {
    app = await createTestApp();
    occurrenceStore = app.get(OCCURRENCE_STORE);
  });

  afterAll(async () => {
    await app.close();
  });

  async function bootstrapSession(localKeyRef: string): Promise<{
    sessionToken: string;
    reputationId: string;
  }> {
    const response = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({ cityId, localKeyRef })
      .expect(201);

    return {
      sessionToken: response.body.sessionToken as string,
      reputationId: response.body.reputationId as string,
    };
  }

  it('should_return_401_when_creating_without_session', async () => {
    await request(app.getHttpServer())
      .post('/occurrences')
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(401);
  });

  it('should_return_201_when_valid_ghost_session_creates_pothole', async () => {
    const { sessionToken } = await bootstrapSession('fingerprint-ghost-report');

    const response = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(201);

    expect(response.body.status).toBe('unverified');
    expect(response.body.confidenceLevel).toBe(0);
    expect(response.body.cityId).toBe(cityId);
    expect(response.body.author).toBeUndefined();
  });

  it('should_persist_occurrence_with_unverified_status', async () => {
    const { sessionToken } = await bootstrapSession('fingerprint-unverified-status');

    const response = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(201);

    const stored = await occurrenceStore.findById(response.body.id as string, cityId);

    expect(stored).not.toBeNull();
    expect(stored?.status).toBe('unverified');
    expect(stored?.confidenceLevel).toBe(0);
  });

  it('should_return_400_when_contributor_gps_in_body', async () => {
    const { sessionToken } = await bootstrapSession('fingerprint-gps-check');

    await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
        contributorLatitude: -12.5423,
      })
      .expect(400);
  });

  it('should_return_403_when_city_id_mismatches_tenant', async () => {
    const { sessionToken } = await bootstrapSession('fingerprint-city-mismatch');

    await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        cityId: '01932f1a-0000-7000-8000-000000000099',
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(403);
  });

  it('should_return_400_for_invalid_category', async () => {
    const { sessionToken } = await bootstrapSession('fingerprint-invalid-category');

    const response = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        category: 'not-a-real-category',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(400);

    expect(response.body.code).toBe('INVALID_CATEGORY');
  });

  it('should_omit_author_on_crime_category_response', async () => {
    const { sessionToken } = await bootstrapSession('fingerprint-crime-report');

    const response = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        category: 'crime',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(201);

    expect(response.body.category).toBe('crime');
    expect(response.body.author).toBeUndefined();
  });

  it('should_store_contributor_reputation_id_in_database', async () => {
    const { sessionToken, reputationId } = await bootstrapSession(
      'fingerprint-reputation-store',
    );

    const response = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(201);

    const stored = await occurrenceStore.findById(response.body.id as string, cityId);

    expect(stored?.reputationId).toBe(reputationId);
  });

  it('should_generate_uuidv7_primary_key', async () => {
    const { sessionToken } = await bootstrapSession('fingerprint-uuidv7');

    const response = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(201);

    expect(isUuidV7(response.body.id as string)).toBe(true);
  });

  it('should_not_echo_raw_description_in_error_on_doxxing', async () => {
    const { sessionToken } = await bootstrapSession('fingerprint-doxxing-error');
    const doxxingDescription = 'Call me at (65) 99999-8888';

    const response = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
        description: doxxingDescription,
      })
      .expect(400);

    expect(response.body.code).toBe('DOXXING_DETECTED');
    expect(JSON.stringify(response.body)).not.toContain(doxxingDescription);
  });

  it('should_not_log_contributor_ref_in_info_logs', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const { sessionToken, reputationId } = await bootstrapSession(
      'fingerprint-no-contributor-log',
    );

    await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(201);

    const loggedOutput = [...infoSpy.mock.calls, ...logSpy.mock.calls]
      .flat()
      .map((entry) => JSON.stringify(entry))
      .join(' ');

    expect(loggedOutput).not.toContain(reputationId);

    infoSpy.mockRestore();
    logSpy.mockRestore();
  });
});

describe('Create occurrence rate limit integration', () => {
  let app: INestApplication;
  const cityId = '01932f1a-0000-7000-8000-000000000001';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(REDIS_RATE_LIMITER)
      .useClass(InMemoryRateLimiter)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should_return_429_on_eleventh_create_in_one_hour', async () => {
    const bootstrap = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({ cityId, localKeyRef: 'fingerprint-rate-limit-create' })
      .expect(201);

    const sessionToken = bootstrap.body.sessionToken as string;
    const payload = {
      category: 'pothole',
      latitude: -12.5423,
      longitude: -55.7214,
    };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app.getHttpServer())
        .post('/occurrences')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(payload)
        .expect(201);
    }

    const limited = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send(payload)
      .expect(429);

    expect(limited.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
