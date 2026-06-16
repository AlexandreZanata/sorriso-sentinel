import { StyleSheet, View } from 'react-native';
import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { ScreenShell } from '../../../ui/templates/screen-shell';
import { Text } from '../../../ui/atoms/text';
import { Spinner } from '../../../ui/atoms/spinner';
import { MapViewport } from '../../../ui/organisms/map-viewport';
import { MapOfflineDownloadBanner } from '../components/map-offline-download-banner';
import { useMapOccurrences } from '../hooks/use-map-occurrences';
import { useMapRegionDownload } from '../hooks/use-map-region-download';
import { useMapViewportBounds } from '../hooks/use-map-viewport-bounds';

export function MapScreen() {
  const { t } = useTranslation();
  const { bounds, onBoundsChange } = useMapViewportBounds();
  const { occurrences, isInitialLoading, error } = useMapOccurrences(bounds);
  const regionDownload = useMapRegionDownload();
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
      <MapViewport pins={pins} onBoundsChange={onBoundsChange} />
      <MapOfflineDownloadBanner
        progress={regionDownload.progress}
        isInstalled={regionDownload.isInstalled}
      />
      {isInitialLoading ? (
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
