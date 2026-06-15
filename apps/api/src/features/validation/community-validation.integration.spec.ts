import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { InMemoryRateLimiter } from '../../infrastructure/redis/in-memory-rate-limiter.service';
import { REDIS_RATE_LIMITER } from '../../infrastructure/redis/redis.tokens';
import { createTestApp, request } from '../../test/test-app';

describe('Community validation integration', () => {
  let app: INestApplication;
  const cityId = '01932f1a-0000-7000-8000-000000000001';

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function bootstrapSession(localKeyRef: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({ cityId, localKeyRef })
      .expect(201);

    return response.body.sessionToken as string;
  }

  async function createOccurrence(token: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'pothole',
        latitude: -12.5423,
        longitude: -55.7214,
      })
      .expect(201);

    return response.body.id as string;
  }

  it('should_return_401_when_confirm_without_session', async () => {
    const authorToken = await bootstrapSession('fingerprint-validation-no-session-author');
    const occurrenceId = await createOccurrence(authorToken);

    await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/confirm`)
      .send({ version: 1 })
      .expect(401);
  });

  it('should_return_403_when_confirming_own_occurrence', async () => {
    const authorToken = await bootstrapSession('fingerprint-validation-self-confirm');
    const occurrenceId = await createOccurrence(authorToken);

    const response = await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/confirm`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ version: 1 })
      .expect(403);

    expect(response.body.code).toBe('SELF_VALIDATION_FORBIDDEN');
  });

  it('should_return_403_on_second_vote_same_occurrence', async () => {
    const authorToken = await bootstrapSession('fingerprint-validation-dup-author');
    const voterToken = await bootstrapSession('fingerprint-validation-dup-voter');
    const occurrenceId = await createOccurrence(authorToken);

    await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/confirm`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ version: 1, reason: 'verified_locally' })
      .expect(200);

    const duplicate = await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/confirm`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ version: 2 })
      .expect(403);

    expect(duplicate.body.code).toBe('DUPLICATE_VOTE');
  });

  it('should_increase_confidence_after_confirm', async () => {
    const authorToken = await bootstrapSession('fingerprint-validation-confidence-author');
    const voterToken = await bootstrapSession('fingerprint-validation-confidence-voter');
    const occurrenceId = await createOccurrence(authorToken);

    const response = await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/confirm`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ version: 1, reason: 'verified_locally' })
      .expect(200);

    expect(response.body.confidenceLevel).toBe(20);
    expect(response.body.status).toBe('under_review');
    expect(response.body.version).toBe(2);
  });

  it('should_reach_active_after_five_distinct_confirms', async () => {
    const authorToken = await bootstrapSession('fingerprint-validation-active-author');
    const occurrenceId = await createOccurrence(authorToken);
    let version = 1;

    for (let voterIndex = 0; voterIndex < 5; voterIndex += 1) {
      const voterToken = await bootstrapSession(
        `fingerprint-validation-active-voter-${voterIndex}`,
      );

      const response = await request(app.getHttpServer())
        .post(`/occurrences/${occurrenceId}/confirm`)
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ version, reason: 'verified_locally' })
        .expect(200);

      version = response.body.version as number;
    }

    const detail = await request(app.getHttpServer())
      .get(`/occurrences/${occurrenceId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(200);

    expect(detail.body.status).toBe('active');
    expect(detail.body.confidenceLevel).toBe(100);
  });

  it('should_return_409_when_version_stale', async () => {
    const authorToken = await bootstrapSession('fingerprint-validation-stale-author');
    const voterToken = await bootstrapSession('fingerprint-validation-stale-voter');
    const occurrenceId = await createOccurrence(authorToken);

    await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/confirm`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ version: 1 })
      .expect(200);

    const conflict = await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/confirm`)
      .set('Authorization', `Bearer ${await bootstrapSession('fingerprint-validation-stale-voter-2')}`)
      .send({ version: 1 })
      .expect(409);

    expect(conflict.body.code).toBe('OCCURRENCE_VERSION_CONFLICT');
  });

  it('should_list_comments_for_occurrence', async () => {
    const authorToken = await bootstrapSession('fingerprint-validation-list-comments-author');
    const occurrenceId = await createOccurrence(authorToken);

    const modeResponse = await request(app.getHttpServer())
      .patch('/identity/mode')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ mode: 'pseudonym', pseudonym: 'CommentLister' })
      .expect(200);

    const pseudonymToken = modeResponse.body.sessionToken as string;

    const commentText = 'Visible in list endpoint.';

    await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/comments`)
      .set('Authorization', `Bearer ${pseudonymToken}`)
      .send({ text: commentText })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/occurrences/${occurrenceId}/comments`)
      .set('Authorization', `Bearer ${pseudonymToken}`)
      .expect(200);

    expect(list.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: commentText,
          author: expect.objectContaining({
            displayPolicy: 'pseudonym',
            pseudonym: 'CommentLister',
          }),
        }),
      ]),
    );
  });

  it('should_return_401_when_listing_comments_without_session', async () => {
    const authorToken = await bootstrapSession('fingerprint-validation-list-no-session');
    const occurrenceId = await createOccurrence(authorToken);

    await request(app.getHttpServer())
      .get(`/occurrences/${occurrenceId}/comments`)
      .expect(401);
  });
});

describe('Community validation rate limit integration', () => {
  let app: INestApplication;
  const cityId = '01932f1a-0000-7000-8000-000000000001';
  const previousLimit = process.env.MAX_VALIDATION_VOTES_PER_HOUR;

  beforeAll(async () => {
    process.env.MAX_VALIDATION_VOTES_PER_HOUR = '3';

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

    if (previousLimit === undefined) {
      delete process.env.MAX_VALIDATION_VOTES_PER_HOUR;
    } else {
      process.env.MAX_VALIDATION_VOTES_PER_HOUR = previousLimit;
    }
  });

  it('should_return_429_on_validation_rate_limit_exceeded', async () => {
    const authorBootstrap = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({ cityId, localKeyRef: 'fingerprint-validation-rate-limit-author' })
      .expect(201);

    const authorToken = authorBootstrap.body.sessionToken as string;

    const voterBootstrap = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({ cityId, localKeyRef: 'fingerprint-validation-rate-limit-voter' })
      .expect(201);

    const voterToken = voterBootstrap.body.sessionToken as string;

    for (let index = 0; index < 3; index += 1) {
      const created = await request(app.getHttpServer())
        .post('/occurrences')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          category: 'pothole',
          latitude: -12.5423 + index * 0.0001,
          longitude: -55.7214,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/occurrences/${created.body.id as string}/confirm`)
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ version: 1 })
        .expect(200);
    }

    const fourthOccurrence = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        category: 'pothole',
        latitude: -12.5427,
        longitude: -55.7214,
      })
      .expect(201);

    const limited = await request(app.getHttpServer())
      .post(`/occurrences/${fourthOccurrence.body.id as string}/confirm`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ version: 1 })
      .expect(429);

    expect(limited.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
