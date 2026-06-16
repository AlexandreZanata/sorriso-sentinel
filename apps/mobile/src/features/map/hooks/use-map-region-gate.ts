import * as Localization from 'expo-localization';
import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_DATA_VERSION,
  MwmEngineModule,
  type MwmDownloadProgress,
  type MwmRegionCatalogEntry,
} from '@sorriso-sentinel/mwm-engine';
import { getDefaultCityId } from '../../../api/config';
import { DEFAULT_MAP_REGION_ID } from '../constants';

export type MapRegionGatePhase = 'loading' | 'download' | 'ready';

export function useMapRegionGate() {
  const [phase, setPhase] = useState<MapRegionGatePhase>('loading');
  const [catalogEntry, setCatalogEntry] = useState<MwmRegionCatalogEntry | null>(null);
  const [progress, setProgress] = useState<MwmDownloadProgress>({
    regionId: DEFAULT_MAP_REGION_ID,
    downloadedBytes: 0,
    totalBytes: 0,
    status: 'queued',
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const refreshProgress = useCallback(async () => {
    const next = await MwmEngineModule.getDownloadProgress(DEFAULT_MAP_REGION_ID);
    setProgress(next);
    return next;
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const locale = Localization.getLocales()[0]?.languageTag ?? 'en';
      await MwmEngineModule.initializeEngine({
        writablePath: `mwm/${getDefaultCityId()}`,
        cachePath: 'mwm/cache',
        locale,
        dataVersion: DEFAULT_DATA_VERSION,
        metadataUrl: 'https://cdn-us-1.comaps.app',
      });

      const [installed, entry] = await Promise.all([
        MwmEngineModule.listInstalledRegions(),
        MwmEngineModule.getRegionCatalogEntry(DEFAULT_MAP_REGION_ID),
      ]);

      if (!active) {
        return;
      }

      setCatalogEntry(entry);

      const hasRegion = installed.some((region) => region.id === DEFAULT_MAP_REGION_ID);

      if (hasRegion) {
        setPhase('ready');
        return;
      }

      setPhase('download');
      await refreshProgress();
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [refreshProgress]);

  useEffect(() => {
    if (!isDownloading) {
      return;
    }

    const timer = setInterval(() => {
      void refreshProgress().then((next) => {
        if (next.status === 'finished') {
          setIsDownloading(false);
          setPhase('ready');
        }

        if (next.status === 'failed') {
          setIsDownloading(false);
        }
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, [isDownloading, refreshProgress]);

  const startDownload = useCallback(async () => {
    setIsDownloading(true);
    const ok = await MwmEngineModule.downloadRegion(DEFAULT_MAP_REGION_ID);
    const next = await refreshProgress();

    if (ok && next.status === 'finished') {
      setPhase('ready');
    }

    setIsDownloading(false);
  }, [refreshProgress]);

  return {
    phase,
    catalogEntry,
    progress,
    isDownloading,
    startDownload,
    refreshProgress,
  };
}
