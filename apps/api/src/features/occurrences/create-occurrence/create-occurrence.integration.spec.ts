import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { createTestApp, request } from '../../../test/test-app';

describe('Create occurrence integration', () => {
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
    const sessionToken = await bootstrapSession('fingerprint-ghost-report');

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

  it('should_return_400_when_contributor_gps_in_body', async () => {
    const sessionToken = await bootstrapSession('fingerprint-gps-check');

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

  it('should_omit_author_on_crime_category_response', async () => {
    const sessionToken = await bootstrapSession('fingerprint-crime-report');

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
});
