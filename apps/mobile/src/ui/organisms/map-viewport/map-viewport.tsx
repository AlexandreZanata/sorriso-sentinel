import * as Localization from 'expo-localization';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DEFAULT_DATA_VERSION,
  MwmEngineModule,
  MwmMapView,
  type MwmOccurrencePin,
} from '@sorriso-sentinel/mwm-engine';
import { getDefaultCityId } from '../../../api/config';
import { Text } from '../../atoms/text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface MapViewportProps {
  pins: MwmOccurrencePin[];
}

const DEFAULT_REGION = 'Brazil_Mato Grosso';

export function MapViewport({ pins }: MapViewportProps) {
  const [downloadStatus, setDownloadStatus] = useState('queued');
  const [isReady, setIsReady] = useState(false);

  const refreshDownloadStatus = useCallback(async () => {
    const progress = await MwmEngineModule.getDownloadProgress(DEFAULT_REGION);
    setDownloadStatus(progress.status);
  }, []);

  useEffect(() => {
    let active = true;

    async function setup() {
      const locale = Localization.getLocales()[0]?.languageTag ?? 'en';
      const ok = await MwmEngineModule.initializeEngine({
        writablePath: `mwm/${getDefaultCityId()}`,
        cachePath: 'mwm/cache',
        locale,
        dataVersion: DEFAULT_DATA_VERSION,
        metadataUrl: 'https://cdn-us-1.comaps.app',
      });

      if (!active) {
        return;
      }

      setIsReady(ok);

      if (!ok) {
        return;
      }

      const installed = await MwmEngineModule.listInstalledRegions();
      const hasRegion = installed.some((region) => region.id === DEFAULT_REGION);

      if (!hasRegion) {
        void MwmEngineModule.downloadRegion(DEFAULT_REGION).then(() => {
          if (active) {
            void refreshDownloadStatus();
          }
        });
      }

      void refreshDownloadStatus();
    }

    void setup();

    return () => {
      active = false;
    };
  }, [refreshDownloadStatus]);

  const showDownloadBanner =
    isReady && downloadStatus !== 'finished' && downloadStatus !== 'failed';

  return (
    <View style={styles.container}>
      <MwmMapView style={styles.map} pins={pins} testID="mwm-map-view" />
      {showDownloadBanner ? (
        <View style={styles.banner}>
          <Text variant="caption">
            Downloading offline map ({downloadStatus})…
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
