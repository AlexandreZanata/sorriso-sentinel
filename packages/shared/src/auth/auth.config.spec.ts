import { describe, expect, it } from 'vitest';
import { loadAuthConfigFromEnv } from './auth.config.js';

describe('loadAuthConfigFromEnv', () => {
  it('should_use_defaults_when_env_missing', () => {
    expect(loadAuthConfigFromEnv({})).toMatchObject({
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604800,
      bcryptCost: 12,
      jwtIssuer: 'sorriso-sentinel',
      jwtAudience: 'sorriso-sentinel-api',
    });
  });
});
