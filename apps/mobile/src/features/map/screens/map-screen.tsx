import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { ScreenShell } from '../../../ui/templates/screen-shell';
import { Text } from '../../../ui/atoms/text';
import { MapViewport } from '../../../ui/organisms/map-viewport';
import { MapOfflineDownloadBanner } from '../components/map-offline-download-banner';
import { MwmPlacePageSheet } from '../components/mwm-place-page-sheet';
import { useMapOccurrences } from '../hooks/use-map-occurrences';
import { useMapPlacePage } from '../hooks/use-map-place-page';
import { useMapRegionDownload } from '../hooks/use-map-region-download';
import { colors } from '../../../ui/theme/colors';
import { spacing } from '../../../ui/theme/spacing';

export function MapScreen() {
  const { t } = useTranslation();
  const { occurrences, error, retry } = useMapOccurrences();
  const regionDownload = useMapRegionDownload();
  const { placePage, dismissPlacePage } = useMapPlacePage();
  const pins = useMemo(
    () =>
      occurrences.map((occurrence) => ({
        id: occurrence.id,
        latitude: occurrence.location.latitude,
        longitude: occurrence.location.longitude,
        status: occurrence.status,
        category: occurrence.category,
      })),
    [occurrences],
  );

  return (
    <ScreenShell
      header={<Text variant="subtitle">{t(I18N_KEYS.tabs.map)}</Text>}
      contentStyle={styles.content}
    >
      <MapViewport pins={pins} />
      <MapOfflineDownloadBanner
        progress={regionDownload.progress}
        isInstalled={regionDownload.isInstalled}
      />
      {placePage ? (
        <MwmPlacePageSheet place={placePage} onDismiss={dismissPlacePage} />
      ) : null}
      {error ? (
        <Pressable style={styles.errorBanner} onPress={retry}>
          <Text variant="caption" color="danger">
            {t(error)}
          </Text>
          <Text variant="caption" color="textMuted">
            {t(I18N_KEYS.map.retryLoad)}
          </Text>
        </Pressable>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 0,
  },
  errorBanner: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
