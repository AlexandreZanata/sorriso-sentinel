import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_VALIDATION_VOTES_PER_HOUR,
  DEFAULT_VALIDATION_RATE_LIMIT_WINDOW_SECONDS,
  loadValidationRateLimitFromEnv,
} from './validation.config.js';

describe('loadValidationRateLimitFromEnv', () => {
  it('should_use_defaults_when_env_missing', () => {
    expect(loadValidationRateLimitFromEnv({})).toEqual({
      limit: DEFAULT_MAX_VALIDATION_VOTES_PER_HOUR,
      windowSeconds: DEFAULT_VALIDATION_RATE_LIMIT_WINDOW_SECONDS,
    });
  });

  it('should_parse_positive_integers_from_env', () => {
    expect(
      loadValidationRateLimitFromEnv({
        MAX_VALIDATION_VOTES_PER_HOUR: '15',
        VALIDATION_RATE_LIMIT_WINDOW_SECONDS: '1800',
      }),
    ).toEqual({
      limit: 15,
      windowSeconds: 1800,
    });
  });

  it('should_fall_back_on_invalid_values', () => {
    expect(
      loadValidationRateLimitFromEnv({
        MAX_VALIDATION_VOTES_PER_HOUR: '0',
        VALIDATION_RATE_LIMIT_WINDOW_SECONDS: 'abc',
      }),
    ).toEqual({
      limit: DEFAULT_MAX_VALIDATION_VOTES_PER_HOUR,
      windowSeconds: DEFAULT_VALIDATION_RATE_LIMIT_WINDOW_SECONDS,
    });
  });
});
