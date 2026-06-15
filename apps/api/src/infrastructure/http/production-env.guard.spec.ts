import { describe, expect, it } from 'vitest';
import { assertProductionEnvironment } from './production-env.guard';

describe('assertProductionEnvironment', () => {
  it('should_skip_validation_outside_production', () => {
    expect(() =>
      assertProductionEnvironment({
        NODE_ENV: 'development',
      }),
    ).not.toThrow();
  });

  it('should_reject_dev_jwt_secret_in_production', () => {
    expect(() =>
      assertProductionEnvironment({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example.com',
        JWT_ACCESS_SECRET: 'dev-jwt-secret-change-me',
      }),
    ).toThrow(/JWT_ACCESS_SECRET must be set to a non-default value/);
  });

  it('should_accept_production_configuration', () => {
    expect(() =>
      assertProductionEnvironment({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example.com',
        JWT_ACCESS_SECRET: 'prod-secret-from-secret-manager',
      }),
    ).not.toThrow();
  });
});
