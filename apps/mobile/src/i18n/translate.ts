import type { AppLocale } from './locale';
import en from './locales/en.json';
import ptBr from './locales/pt-BR.json';

const catalogs: Record<AppLocale, Record<string, string>> = {
  en: en as Record<string, string>,
  'pt-BR': ptBr as Record<string, string>,
};

export type TranslateParams = Record<string, string | number>;

export function translate(
  locale: AppLocale,
  key: string,
  params?: TranslateParams,
): string {
  const primary = catalogs[locale][key];
  const fallback = catalogs.en[key];
  const template = primary ?? fallback ?? key;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
