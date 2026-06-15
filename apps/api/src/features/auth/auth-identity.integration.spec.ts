import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { USER_ACCOUNT_REPOSITORY } from '@sorriso-sentinel/domain';
import type { UserAccountRepositoryPort } from '@sorriso-sentinel/domain';
import { createTestApp, request } from '../../test/test-app';

describe('Auth identity integration', () => {
  let app: INestApplication;
  let accounts: UserAccountRepositoryPort;
  const cityId = '01932f1a-0000-7000-8000-000000000001';
  const password = 'secure-password-12';

  beforeAll(async () => {
    app = await createTestApp();
    accounts = app.get(USER_ACCOUNT_REPOSITORY);
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

  async function registerAndVerifyAccount(params: {
    localKeyRef: string;
    email: string;
    grantAdmin?: boolean;
  }): Promise<void> {
    const token = await bootstrapSession(params.localKeyRef);
    const pqcRef = 'a'.repeat(64);
    const pqcSignature = Buffer.from('valid-dev-signature').toString('base64url');

    const registered = await request(app.getHttpServer())
      .post('/user-accounts/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: params.email,
        displayName: 'Auth Test User',
        password,
        deviceNonce: `nonce-${params.localKeyRef}`,
        pqcPublicKeyRef: pqcRef,
        pqcSignature,
        lgpdConsent: {
          termsVersion: '1.0.0',
          privacyVersion: '1.0.0',
          consentedAt: '2026-06-15T12:00:00.000Z',
          purposes: ['account_creation', 'email_communication'],
        },
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/user-accounts/verify-email')
      .send({
        userAccountId: registered.body.userAccountId,
        cityId,
        token: registered.body.verificationToken,
      })
      .expect(200);

    if (params.grantAdmin) {
      await accounts.grantRole(
        cityId,
        registered.body.userAccountId as string,
        'city_admin',
      );
    }
  }

  it('should_return_401_for_invalid_access_token', async () => {
    await request(app.getHttpServer())
      .get('/user-accounts/me')
      .set('Authorization', 'Bearer not-a-valid-token')
      .expect(401);
  });

  it('should_login_and_return_jwt_access_and_refresh_tokens', async () => {
    const email = `auth.login.${Date.now()}@example.com`;
    await registerAndVerifyAccount({
      localKeyRef: `fingerprint-auth-login-${Date.now()}`,
      email,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ cityId, email, password })
      .expect(200);

    expect(response.body.accessToken).toBeTypeOf('string');
    expect(response.body.refreshToken).toBeTypeOf('string');
    expect(response.body.expiresInSeconds).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .get('/user-accounts/me')
      .set('Authorization', `Bearer ${response.body.accessToken as string}`)
      .expect(200);
  });

  it('should_rotate_refresh_token', async () => {
    const email = `auth.refresh.${Date.now()}@example.com`;
    await registerAndVerifyAccount({
      localKeyRef: `fingerprint-auth-refresh-${Date.now()}`,
      email,
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ cityId, email, password })
      .expect(200);

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('should_revoke_refresh_token_on_logout', async () => {
    const email = `auth.logout.${Date.now()}@example.com`;
    await registerAndVerifyAccount({
      localKeyRef: `fingerprint-auth-logout-${Date.now()}`,
      email,
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ cityId, email, password })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('should_return_403_on_city_mismatch_header', async () => {
    const email = `auth.tenant.${Date.now()}@example.com`;
    await registerAndVerifyAccount({
      localKeyRef: `fingerprint-auth-tenant-${Date.now()}`,
      email,
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ cityId, email, password })
      .expect(200);

    await request(app.getHttpServer())
      .get('/user-accounts/me')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .set('x-city-id', '01932f1a-0000-7000-8000-000000000099')
      .expect(403);
  });

  it('should_deny_admin_route_without_role', async () => {
    const email = `auth.no-admin.${Date.now()}@example.com`;
    await registerAndVerifyAccount({
      localKeyRef: `fingerprint-auth-no-admin-${Date.now()}`,
      email,
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ cityId, email, password })
      .expect(200);

    await request(app.getHttpServer())
      .get('/admin/audit-summary')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .expect(403);
  });

  it('should_allow_admin_route_with_city_admin_role', async () => {
    const email = `auth.admin.${Date.now()}@example.com`;
    await registerAndVerifyAccount({
      localKeyRef: `fingerprint-auth-admin-${Date.now()}`,
      email,
      grantAdmin: true,
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ cityId, email, password })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/admin/audit-summary')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('totalEntries');
  });
});
