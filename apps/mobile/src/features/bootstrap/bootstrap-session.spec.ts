import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/errors';
import { resolveBootstrapErrorMessage } from './bootstrap-session.errors';

describe('resolveBootstrapErrorMessage', () => {
  it('should_map_api_error_to_i18n_key', () => {
    const message = resolveBootstrapErrorMessage(
      new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many', 'errors.rateLimitExceeded'),
      (key) => `translated:${key}`,
    );

    expect(message).toBe('translated:errors.rateLimitExceeded');
  });

  it('should_use_generic_bootstrap_error_for_unknown_errors', () => {
    const message = resolveBootstrapErrorMessage(new Error('network'), (key) => key);

    expect(message).toBe('bootstrap.error');
  });
});
