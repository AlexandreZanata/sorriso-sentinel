import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { ScreenShell } from '../../../ui/templates/screen-shell';
import { Text } from '../../../ui/atoms/text';
import { Spinner } from '../../../ui/atoms/spinner';
import { MapViewport } from '../../../ui/organisms/map-viewport';
import { useMapOccurrences } from '../hooks/use-map-occurrences';

export function MapScreen() {
  const { t } = useTranslation();
  const { occurrences, isLoading, error } = useMapOccurrences();
  const pins = occurrences.map((occurrence) => ({
    id: occurrence.id,
    latitude: occurrence.location.latitude,
    longitude: occurrence.location.longitude,
    status: occurrence.status,
    category: occurrence.category,
  }));

  return (
    <ScreenShell
      header={<Text variant="subtitle">{t(I18N_KEYS.tabs.map)}</Text>}
      contentStyle={{ padding: 0 }}
    >
      {isLoading ? <Spinner /> : null}
      {error ? <Text>{t(I18N_KEYS.map.loadError)}</Text> : null}
      <MapViewport pins={pins} />
    </ScreenShell>
  );
}
