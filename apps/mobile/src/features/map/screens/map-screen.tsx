import { StyleSheet, View } from 'react-native';
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
      contentStyle={styles.content}
    >
      <MapViewport pins={pins} />
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <Spinner />
        </View>
      ) : null}
      {error ? (
        <View style={styles.errorBanner}>
          <Text variant="caption">{t(I18N_KEYS.map.loadError)}</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  errorBanner: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
});
