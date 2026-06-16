export const APP_LOCALES = ['en', 'pt-BR'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'sentinel-mobile-locale';

export function resolveDeviceLocale(deviceTag: string | undefined): AppLocale {
  const normalized = (deviceTag ?? 'en').toLowerCase();

  if (normalized.startsWith('pt')) {
    return 'pt-BR';
  }

  return 'en';
}

export function parseStoredLocale(value: string | null): AppLocale | null {
  if (value === 'en' || value === 'pt-BR') {
    return value;
  }

  return null;
}

export function resolveAppLocale(
  stored: string | null,
  deviceTag: string | undefined,
): AppLocale {
  return parseStoredLocale(stored) ?? resolveDeviceLocale(deviceTag);
}
