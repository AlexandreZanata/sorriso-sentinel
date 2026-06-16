import { StyleSheet, View } from 'react-native';
import type { AppLocale } from '../../../i18n/locale';
import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { ScreenShell } from '../../../ui/templates/screen-shell';
import { Button } from '../../../ui/atoms/button';
import { Text } from '../../../ui/atoms/text';
import { spacing } from '../../../ui/theme/spacing';

const LOCALE_OPTIONS: AppLocale[] = ['en', 'pt-BR'];

export function SettingsHomeScreen() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <ScreenShell
      header={<Text variant="subtitle">{t(I18N_KEYS.settings.title)}</Text>}
      scrollable
    >
      <Text variant="body" style={styles.sectionLabel}>
        {t(I18N_KEYS.settings.locale)}
      </Text>
      <View style={styles.localeList}>
        {LOCALE_OPTIONS.map((option) => (
          <Button
            key={option}
            label={t(`settings.locale.${option}`)}
            variant={locale === option ? 'primary' : 'secondary'}
            onPress={() => {
              void setLocale(option);
            }}
            style={styles.localeButton}
          />
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  localeList: {
    gap: spacing.sm,
  },
  localeButton: {
    alignSelf: 'stretch',
  },
});
