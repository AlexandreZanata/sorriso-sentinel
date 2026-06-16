import * as Crypto from 'expo-crypto';
import { ApiError, mapStatusToI18nKey } from './errors';
import { CORRELATION_ID_HEADER, getApiBaseUrl } from './config';

export type ApiAuthMode = 'session' | 'jwt' | 'none';

export interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  auth?: ApiAuthMode;
  token?: string | null;
  cityId?: string;
}

function buildCorrelationId(): string {
  return Crypto.randomUUID();
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    [CORRELATION_ID_HEADER]: buildCorrelationId(),
  };

  if (options.auth !== 'none' && options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.cityId) {
    headers['x-city-id'] = options.cityId;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  let payload: Record<string, unknown> = {};

  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new ApiError(
        response.status,
        'INVALID_JSON',
        'Invalid JSON response from server',
        'errors.networkUnavailable',
      );
    }
  }

  if (!response.ok) {
    const code =
      typeof payload.code === 'string' ? payload.code : undefined;
    const message =
      typeof payload.message === 'string'
        ? payload.message
        : `Request failed with status ${response.status}`;

    throw new ApiError(
      response.status,
      code,
      message,
      mapStatusToI18nKey(response.status, code),
    );
  }

  return payload as T;
}
