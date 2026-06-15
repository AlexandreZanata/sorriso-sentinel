import { OBJECT_STORAGE } from '@sorriso-sentinel/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import sharp from 'sharp';
import { createTestApp, request } from '../../test/test-app';
import { InMemoryObjectStorage } from '../../infrastructure/media/in-memory-object-storage.service';

describe('Media upload integration', () => {
  let app: INestApplication;
  let testImage: Buffer;
  const cityId = '01932f1a-0000-7000-8000-000000000001';

  beforeAll(async () => {
    app = await createTestApp();
    testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 120, g: 80, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();
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

  function extractStorageKey(uploadUrl: string): string {
    if (uploadUrl.startsWith('memory://upload/')) {
      const encoded = uploadUrl.slice('memory://upload/'.length).split('?')[0]!;
      return decodeURIComponent(encoded);
    }

    const url = new URL(uploadUrl);
    return url.pathname.replace(/^\//, '').split('/').slice(1).join('/');
  }

  it('should_return_401_when_requesting_slot_without_session', async () => {
    await request(app.getHttpServer())
      .post('/occurrences/01932f1a-0000-7000-8000-000000000099/media/upload-slots')
      .send({ contentType: 'image/jpeg', contentLength: 1024 })
      .expect(401);
  });

  it('should_return_400_when_declared_size_over_limit', async () => {
    const token = await bootstrapSession('fingerprint-media-size-limit');
    const occurrenceId = await createOccurrence(token);

    await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/media/upload-slots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        contentType: 'image/jpeg',
        contentLength: 11 * 1024 * 1024,
      })
      .expect(400);
  });

  it('should_upload_and_list_ready_media_end_to_end', async () => {
    const token = await bootstrapSession('fingerprint-media-e2e');
    const occurrenceId = await createOccurrence(token);

    const slotResponse = await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/media/upload-slots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        contentType: 'image/jpeg',
        contentLength: testImage.length,
      })
      .expect(201);

    const storageKey = extractStorageKey(slotResponse.body.uploadUrl as string);
    const storage = app.get(OBJECT_STORAGE) as InMemoryObjectStorage;
    storage.putObjectDirect(storageKey, testImage, 'image/jpeg');

    await request(app.getHttpServer())
      .post(`/media/upload-slots/${slotResponse.body.slotId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ uploadedKey: storageKey })
      .expect(202);

    const listResponse = await request(app.getHttpServer())
      .get(`/occurrences/${occurrenceId}/media`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0]).toMatchObject({
      id: slotResponse.body.slotId,
      width: 100,
      height: 100,
    });
    expect(listResponse.body.items[0].url).toContain('memory://download/');
    expect(listResponse.body.items[0].url).not.toContain('quarantine');
  });

  it('should_return_403_when_requesting_slot_for_another_users_occurrence', async () => {
    const token = await bootstrapSession('fingerprint-media-idor');
    const otherToken = await bootstrapSession('fingerprint-media-idor-other');

    const occurrenceId = await createOccurrence(token);

    await request(app.getHttpServer())
      .post(`/occurrences/${occurrenceId}/media/upload-slots`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ contentType: 'image/jpeg', contentLength: 1024 })
      .expect(403);
  });
});
