import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { ScreenShell } from '../../../ui/templates/screen-shell';
import { Text } from '../../../ui/atoms/text';

export function CreateOccurrenceScreen() {
  const { t } = useTranslation();

  return (
    <ScreenShell
      header={<Text variant="subtitle">{t(I18N_KEYS.occurrence.create.title)}</Text>}
    >
      <Text>{t(I18N_KEYS.occurrence.create.placeholder)}</Text>
    </ScreenShell>
  );
}
