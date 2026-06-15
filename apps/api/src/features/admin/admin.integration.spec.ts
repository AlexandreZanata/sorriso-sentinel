import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { USER_ACCOUNT_REPOSITORY } from '@sorriso-sentinel/domain';
import type { UserAccountRepositoryPort } from '@sorriso-sentinel/domain';
import { createTestApp, request } from '../../test/test-app';

describe('Admin routes integration', () => {
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

  async function registerVerifyAndGrantRoles(params: {
    localKeyRef: string;
    email: string;
    roles?: string[];
  }): Promise<{ userAccountId: string }> {
    const token = await bootstrapSession(params.localKeyRef);
    const pqcRef = 'a'.repeat(64);
    const pqcSignature = Buffer.from('valid-dev-signature').toString('base64url');

    const registered = await request(app.getHttpServer())
      .post('/user-accounts/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: params.email,
        displayName: 'Admin Route User',
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

    for (const role of params.roles ?? []) {
      await accounts.grantRole(
        cityId,
        registered.body.userAccountId as string,
        role,
      );
    }

    return { userAccountId: registered.body.userAccountId as string };
  }

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ cityId, email, password })
      .expect(200);

    return response.body.accessToken as string;
  }

  it('should_return_401_for_admin_audit_summary_without_auth', async () => {
    await request(app.getHttpServer()).get('/admin/audit-summary').expect(401);
  });

  it('should_return_401_for_admin_moderation_queue_without_auth', async () => {
    await request(app.getHttpServer()).get('/admin/moderation-queue').expect(401);
  });

  it('should_return_403_for_audit_summary_without_security_role', async () => {
    const email = `admin.audit.denied.${Date.now()}@example.com`;
    await registerVerifyAndGrantRoles({
      localKeyRef: `fingerprint-admin-audit-denied-${Date.now()}`,
      email,
    });

    const accessToken = await login(email);

    await request(app.getHttpServer())
      .get('/admin/audit-summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('should_return_403_for_moderation_queue_without_moderator_role', async () => {
    const email = `admin.mod.denied.${Date.now()}@example.com`;
    await registerVerifyAndGrantRoles({
      localKeyRef: `fingerprint-admin-mod-denied-${Date.now()}`,
      email,
    });

    const accessToken = await login(email);

    await request(app.getHttpServer())
      .get('/admin/moderation-queue')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('should_allow_audit_summary_with_security_audit_role', async () => {
    const email = `admin.audit.allowed.${Date.now()}@example.com`;
    await registerVerifyAndGrantRoles({
      localKeyRef: `fingerprint-admin-audit-allowed-${Date.now()}`,
      email,
      roles: ['security_audit'],
    });

    const accessToken = await login(email);

    const response = await request(app.getHttpServer())
      .get('/admin/audit-summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('totalEntries');
    expect(response.body).toHaveProperty('actionCounts');
  });

  it('should_allow_audit_summary_with_city_admin_role', async () => {
    const email = `admin.city-admin.audit.${Date.now()}@example.com`;
    await registerVerifyAndGrantRoles({
      localKeyRef: `fingerprint-admin-city-audit-${Date.now()}`,
      email,
      roles: ['city_admin'],
    });

    const accessToken = await login(email);

    const response = await request(app.getHttpServer())
      .get('/admin/audit-summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.status).toBe('ok');
  });

  it('should_allow_moderation_queue_with_moderator_role', async () => {
    const email = `admin.mod.allowed.${Date.now()}@example.com`;
    await registerVerifyAndGrantRoles({
      localKeyRef: `fingerprint-admin-mod-allowed-${Date.now()}`,
      email,
      roles: ['moderator'],
    });

    const accessToken = await login(email);

    const response = await request(app.getHttpServer())
      .get('/admin/moderation-queue')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('pendingReviewCount');
  });

  it('should_allow_moderation_queue_with_city_admin_role', async () => {
    const email = `admin.city-admin.mod.${Date.now()}@example.com`;
    await registerVerifyAndGrantRoles({
      localKeyRef: `fingerprint-admin-city-mod-${Date.now()}`,
      email,
      roles: ['city_admin'],
    });

    const accessToken = await login(email);

    await request(app.getHttpServer())
      .get('/admin/moderation-queue')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
