import * as Localization from 'expo-localization';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MwmEngineModule, MwmMapView, type MwmOccurrencePin } from '@sorriso-sentinel/mwm-engine';
import { getDefaultCityId } from '../../../api/config';
import { Text } from '../../atoms/text';
import { Button } from '../../atoms/button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface MapViewportProps {
  pins: MwmOccurrencePin[];
}

const DEFAULT_REGION = 'brazil';
const DATA_VERSION = 1;

export function MapViewport({ pins }: MapViewportProps) {
  const [downloadStatus, setDownloadStatus] = useState('queued');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function setup() {
      const locale = Localization.getLocales()[0]?.languageTag ?? 'en';
      const ok = await MwmEngineModule.initializeEngine({
        writablePath: `mwm/${getDefaultCityId()}`,
        cachePath: 'mwm/cache',
        locale,
        dataVersion: DATA_VERSION,
        metadataUrl: 'https://cdn.organicmaps.app/maps/omim-data',
      });

      if (active) {
        setIsReady(ok);
      }
    }

    void setup();

    return () => {
      active = false;
    };
  }, []);

  const pinCountLabel = useMemo(() => `${pins.length} pins loaded`, [pins.length]);

  async function handleDownloadBaseMap() {
    await MwmEngineModule.downloadRegion(DEFAULT_REGION);
    const progress = await MwmEngineModule.getDownloadProgress(DEFAULT_REGION);
    setDownloadStatus(progress.status);
  }

  return (
    <View style={styles.container}>
      <MwmMapView style={styles.map} pins={pins} testID="mwm-map-view" />
      <View style={styles.controls}>
        <Text variant="caption">Engine ready: {isReady ? 'yes' : 'no'}</Text>
        <Text variant="caption">Download status: {downloadStatus}</Text>
        <Text variant="caption">{pinCountLabel}</Text>
        <Button
          label="Download base map package"
          onPress={() => {
            void handleDownloadBaseMap();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    minHeight: 280,
  },
  controls: {
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
});
