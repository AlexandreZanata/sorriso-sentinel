export type DocsLocale = 'en' | 'pt';

export const DOCS_LOCALES: DocsLocale[] = ['en', 'pt'];

const STORAGE_LOCALE = 'sentinel-docs-locale';

export function resolveLocaleFromAcceptLanguage(header?: string | null): DocsLocale {
  if (!header) {
    return 'en';
  }

  for (const part of header.split(',')) {
    const lang = part.split(';')[0]?.trim().toLowerCase() ?? '';
    if (lang.startsWith('pt')) {
      return 'pt';
    }
    if (lang.startsWith('en')) {
      return 'en';
    }
  }

  return 'en';
}

export function resolveClientLocale(stored?: string | null, navigatorLang?: string): DocsLocale {
  if (stored === 'pt' || stored === 'en') {
    return stored;
  }

  const nav = (navigatorLang ?? 'en').toLowerCase();
  return nav.startsWith('pt') ? 'pt' : 'en';
}

export { STORAGE_LOCALE };
