import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { createTestApp, request } from '../../../test/test-app';

describe('Bootstrap session integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should_bootstrap_session_without_authentication', async () => {
    const response = await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({
        cityId: '01932f1a-0000-7000-8000-000000000001',
        localKeyRef: 'fingerprint-abc12345',
      })
      .expect(201);

    expect(response.body.sessionToken).toEqual(expect.any(String));
    expect(response.body.reputationId).toMatch(/^Rep-[A-Z0-9]{5}$/);
    expect(response.body.contributorId).toEqual(expect.any(String));
    expect(response.body.identityMode).toBe('ghost');
  });

  it('should_return_400_when_bootstrap_payload_has_extra_fields', async () => {
    await request(app.getHttpServer())
      .post('/sessions/bootstrap')
      .send({
        cityId: '01932f1a-0000-7000-8000-000000000001',
        localKeyRef: 'fingerprint-abc12345',
        deviceModel: 'Pixel 8',
      })
      .expect(400);
  });
});
