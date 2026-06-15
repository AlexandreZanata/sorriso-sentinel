import { describe, expect, it, vi } from 'vitest';
import { JwtAccessTokenService } from './jwt-access-token.service';

describe('JwtAccessTokenService', () => {
  const service = new JwtAccessTokenService();

  const claims = {
    contributorId: '01932f1a-0000-7000-8000-000000000002',
    cityId: '01932f1a-0000-7000-8000-000000000001',
    reputationId: 'Rep-VOTR1',
    identityMode: 'ghost' as const,
    pseudonym: null,
    userAccountId: '01932f1a-0000-7000-8000-000000000099',
    roles: ['city_admin' as const],
  };

  it('should_issue_and_verify_access_token', () => {
    const token = service.issue(claims);
    expect(service.verify(token)).toEqual(claims);
  });

  it('should_return_null_for_tampered_token', () => {
    const token = service.issue(claims);
    expect(service.verify(`${token}x`)).toBeNull();
  });

  it('should_return_null_for_expired_access_token', () => {
    const previous = process.env.ACCESS_TOKEN_TTL_SECONDS;
    process.env.ACCESS_TOKEN_TTL_SECONDS = '1';
    const shortLived = new JwtAccessTokenService();
    const token = shortLived.issue(claims);

    const payload = JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as { exp: number };

    const expiredAt = (payload.exp + 2) * 1000;
    vi.useFakeTimers();
    vi.setSystemTime(expiredAt);

    expect(shortLived.verify(token)).toBeNull();

    vi.useRealTimers();
    process.env.ACCESS_TOKEN_TTL_SECONDS = previous;
  });
});
