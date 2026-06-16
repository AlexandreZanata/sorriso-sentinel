import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { Spinner } from '../../../ui/atoms/spinner';
import { Text } from '../../../ui/atoms/text';
import { MapDownloadGateCard } from '../../../ui/organisms/map-download-gate';
import { colors } from '../../../ui/theme/colors';
import { spacing } from '../../../ui/theme/spacing';
import { DEFAULT_MAP_REGION_ID } from '../constants';
import type { useMapRegionGate } from '../hooks/use-map-region-gate';

type MapRegionGateState = ReturnType<typeof useMapRegionGate>;

export interface MapDownloadGateScreenProps {
  gate: MapRegionGateState;
}

export function MapDownloadGateScreen({ gate }: MapDownloadGateScreenProps) {
  const { t } = useTranslation();
  const { phase, catalogEntry, progress, isDownloading, startDownload } = gate;

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingShell}>
          <View style={styles.loadingCard}>
            <Spinner size="large" />
            <Text variant="subtitle">{t(I18N_KEYS.app.name)}</Text>
            <Text variant="body" color="textMuted" style={styles.loadingText}>
              {t(I18N_KEYS.map.download.preparing)}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <View style={styles.backdropTop} />
        <MapDownloadGateCard
          regionId={DEFAULT_MAP_REGION_ID}
          catalogEntry={catalogEntry}
          progress={progress}
          isDownloading={isDownloading}
          onDownload={() => {
            void startDownload();
          }}
        />
        <Text variant="caption" color="textMuted" style={styles.footer}>
          {t(I18N_KEYS.app.tagline)}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  shell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  backdropTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: colors.primaryMuted,
  },
  loadingShell: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignSelf: 'stretch',
  },
  loadingText: {
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
