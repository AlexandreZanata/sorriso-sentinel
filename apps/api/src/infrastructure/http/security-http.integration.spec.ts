import { afterEach, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { configureHttp } from './http-config';

describe('Security HTTP integration', () => {
  const previousEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...previousEnv };
  });

  it('should_set_security_headers_on_health_in_production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://app.example.com';
    process.env.JWT_ACCESS_SECRET = 'prod-secret-from-secret-manager';
    process.env.TRUST_PROXY = 'true';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    configureHttp(app);
    await app.init();

    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(response.headers['strict-transport-security']).toContain(
      'max-age=31536000',
    );

    await app.close();
  });

  it('should_reject_disallowed_cors_origin_in_production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://app.example.com';
    process.env.JWT_ACCESS_SECRET = 'prod-secret-from-secret-manager';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    configureHttp(app);
    await app.init();

    const response = await request(app.getHttpServer())
      .options('/health')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();

    await app.close();
  });
});
