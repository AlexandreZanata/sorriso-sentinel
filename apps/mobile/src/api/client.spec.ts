import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  randomUUID: vi.fn(),
}));

import * as Crypto from 'expo-crypto';
import { apiRequest } from './client';

describe('apiRequest', () => {
  it('should_attach_bearer_token_when_auth_session', async () => {
    vi.mocked(Crypto.randomUUID).mockReturnValue('corr-id-1');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/health', {
      auth: 'session',
      token: 'session-token',
      cityId: 'city-1',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(headers.Authorization).toBe('Bearer session-token');
    expect(headers['x-city-id']).toBe('city-1');
    expect(headers['x-correlation-id']).toBe('corr-id-1');
  });

  it('should_throw_api_error_on_non_ok_response', async () => {
    vi.mocked(Crypto.randomUUID).mockReturnValue('corr-id-2');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Unauthorized' }),
    }));

    await expect(apiRequest('/occurrences')).rejects.toMatchObject({
      status: 401,
      i18nKey: 'errors.sessionExpired',
    });
  });
});
