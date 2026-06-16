export const DEFAULT_API_URL = 'http://127.0.0.1:3010';
export const DEFAULT_CITY_ID = '01932f1a-0000-7000-8000-000000000001';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
}

export function getDefaultCityId(): string {
  return process.env.EXPO_PUBLIC_DEFAULT_CITY_ID?.trim() || DEFAULT_CITY_ID;
}
