import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module';
import { createTestApp, request } from '../../../test/test-app';

describe('Read occurrence integration', () => {
  let app: INestApplication;
  const cityId = '01932f1a-0000-7000-8000-000000000001';
  const bbox = {
    minLatitude: -12.55,
    maxLatitude: -12.53,
    minLongitude: -55.73,
    maxLongitude: -55.71,
  };

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

  async function createOccurrence(
    token: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/occurrences')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return response.body.id as string;
  }

  it('should_return_401_when_listing_without_session', async () => {
    await request(app.getHttpServer())
      .get('/occurrences')
      .query(bbox)
      .expect(401);
  });

  it('should_return_400_when_bbox_is_invalid', async () => {
    const token = await bootstrapSession('fingerprint-read-invalid-bbox');

    await request(app.getHttpServer())
      .get('/occurrences')
      .set('Authorization', `Bearer ${token}`)
      .query({
        ...bbox,
        minLatitude: -12.53,
        maxLatitude: -12.55,
      })
      .expect(400);
  });

  it('should_list_public_occurrence_inside_bbox', async () => {
    const token = await bootstrapSession('fingerprint-read-list-public');
    const occurrenceId = await createOccurrence(token, {
      category: 'pothole',
      latitude: -12.5423,
      longitude: -55.7214,
      privacyLevel: 'public',
    });

    const response = await request(app.getHttpServer())
      .get('/occurrences')
      .set('Authorization', `Bearer ${token}`)
      .query(bbox)
      .expect(200);

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: occurrenceId,
          location: { latitude: -12.5423, longitude: -55.7214 },
        }),
      ]),
    );
  });

  it('should_exclude_hidden_occurrence_from_bbox_list', async () => {
    const token = await bootstrapSession('fingerprint-read-list-hidden');
    const hiddenId = await createOccurrence(token, {
      category: 'pothole',
      latitude: -12.5424,
      longitude: -55.7215,
      privacyLevel: 'hidden',
    });

    const response = await request(app.getHttpServer())
      .get('/occurrences')
      .set('Authorization', `Bearer ${token}`)
      .query(bbox)
      .expect(200);

    expect(response.body.items.find((item: { id: string }) => item.id === hiddenId)).toBeUndefined();
  });

  it('should_return_occurrence_detail_without_coordinates_for_hidden_privacy', async () => {
    const token = await bootstrapSession('fingerprint-read-detail-hidden');
    const occurrenceId = await createOccurrence(token, {
      category: 'pothole',
      latitude: -12.5425,
      longitude: -55.7216,
      privacyLevel: 'hidden',
      description: 'Hidden pothole',
    });

    const response = await request(app.getHttpServer())
      .get(`/occurrences/${occurrenceId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.privacyLevel).toBe('hidden');
    expect(response.body.location).toBeUndefined();
    expect(response.body.description).toBe('Hidden pothole');
  });

  it('should_return_404_for_unknown_occurrence_in_same_city', async () => {
    const token = await bootstrapSession('fingerprint-read-detail-missing');

    await request(app.getHttpServer())
      .get('/occurrences/01932f1a-0000-7000-8000-000000009999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('should_not_list_occurrence_outside_bbox', async () => {
    const token = await bootstrapSession('fingerprint-read-outside-bbox');
    const occurrenceId = await createOccurrence(token, {
      category: 'pothole',
      latitude: -12.6,
      longitude: -55.8,
      privacyLevel: 'public',
    });

    const response = await request(app.getHttpServer())
      .get('/occurrences')
      .set('Authorization', `Bearer ${token}`)
      .query(bbox)
      .expect(200);

    expect(response.body.items.find((item: { id: string }) => item.id === occurrenceId)).toBeUndefined();
  });

  it('should_strip_author_and_description_for_sensitive_occurrence_detail', async () => {
    const token = await bootstrapSession('fingerprint-read-sensitive-detail');

    await request(app.getHttpServer())
      .patch('/identity/mode')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'pseudonym', pseudonym: 'SensitiveReader' })
      .expect(200);

    const occurrenceId = await createOccurrence(token, {
      category: 'crime',
      latitude: -12.5427,
      longitude: -55.7218,
      description: 'Sensitive report',
    });

    const response = await request(app.getHttpServer())
      .get(`/occurrences/${occurrenceId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.category).toBe('crime');
    expect(response.body.author).toBeUndefined();
    expect(response.body.description).toBeUndefined();
  });
});
