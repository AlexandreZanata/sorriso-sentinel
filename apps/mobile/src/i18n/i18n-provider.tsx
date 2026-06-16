import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  LOCALE_STORAGE_KEY,
  resolveAppLocale,
  type AppLocale,
} from './locale';
import { translate, type TranslateParams } from './translate';

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
  t: (key: string, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLocale(): Promise<void> {
      const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      const deviceTag = Localization.getLocales()[0]?.languageTag;
      const resolved = resolveAppLocale(stored, deviceTag);

      if (active) {
        setLocaleState(resolved);
        setReady(true);
      }
    }

    void loadLocale();

    return () => {
      active = false;
    };
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setLocale],
  );

  if (!ready) {
    return null;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }

  return context;
}
