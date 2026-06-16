import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { type ReactNode } from 'react';
import { I18nProvider } from '../i18n/i18n-provider';
import { SessionProvider } from '../session/session-context';
import { linking } from '../navigation/linking';
import { RootNavigator } from '../navigation/root-navigator';
import type { RootStackParamList } from '../navigation/linking';

const navigationLinking = linking as LinkingOptions<RootStackParamList>;

export function AppProviders({ children }: { children?: ReactNode }) {
  return (
    <I18nProvider>
      <SessionProvider>
        <NavigationContainer linking={navigationLinking}>
          {children ?? <RootNavigator />}
        </NavigationContainer>
      </SessionProvider>
    </I18nProvider>
  );
}
