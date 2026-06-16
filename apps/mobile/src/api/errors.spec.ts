import { describe, expect, it } from 'vitest';
import { mapStatusToI18nKey } from './errors';

describe('mapStatusToI18nKey', () => {
  it('should_map_common_http_statuses', () => {
    expect(mapStatusToI18nKey(401)).toBe('errors.sessionExpired');
    expect(mapStatusToI18nKey(403)).toBe('errors.forbidden');
    expect(mapStatusToI18nKey(404)).toBe('errors.notFound');
    expect(mapStatusToI18nKey(500)).toBe('errors.serverError');
  });

  it('should_map_rate_limit_by_status_or_code', () => {
    expect(mapStatusToI18nKey(429)).toBe('errors.rateLimitExceeded');
    expect(mapStatusToI18nKey(400, 'RATE_LIMIT_EXCEEDED')).toBe(
      'errors.rateLimitExceeded',
    );
  });
});
