import { describe, expect, it } from 'vitest';
import { parseCorsOrigins } from './cors-config';

describe('parseCorsOrigins', () => {
  it('should_default_to_local_web_origins_in_development', () => {
    const origins = parseCorsOrigins({ nodeEnv: 'development' });

    expect(origins).toEqual([
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'http://localhost:8082',
      'http://127.0.0.1:8082',
    ]);
  });

  it('should_parse_comma_separated_origins', () => {
    const origins = parseCorsOrigins({
      nodeEnv: 'production',
      corsOrigins: 'https://app.example.com, https://admin.example.com',
    });

    expect(origins).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('should_reject_missing_origins_in_production', () => {
    expect(() =>
      parseCorsOrigins({ nodeEnv: 'production', corsOrigins: '' }),
    ).toThrow(/CORS_ORIGINS is required/);
  });

  it('should_reject_wildcard_origin_in_production', () => {
    expect(() =>
      parseCorsOrigins({ nodeEnv: 'production', corsOrigins: '*' }),
    ).toThrow(/Wildcard CORS origin is forbidden/);
  });
});
