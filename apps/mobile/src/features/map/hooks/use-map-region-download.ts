import * as Localization from 'expo-localization';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_DATA_VERSION,
  MwmEngineModule,
  type MwmDownloadProgress,
} from '@sorriso-sentinel/mwm-engine';
import { getDefaultCityId } from '../../../api/config';
import { DEFAULT_MAP_REGION_ID } from '../constants';

export function useMapRegionDownload() {
  const [isReady, setIsReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [progress, setProgress] = useState<MwmDownloadProgress>({
    regionId: DEFAULT_MAP_REGION_ID,
    downloadedBytes: 0,
    totalBytes: 0,
    status: 'queued',
  });
  const downloadStarted = useRef(false);

  const refreshProgress = useCallback(async () => {
    const next = await MwmEngineModule.getDownloadProgress(DEFAULT_MAP_REGION_ID);
    setProgress(next);
    return next;
  }, []);

  const startDownload = useCallback(async () => {
    const ok = await MwmEngineModule.downloadRegion(DEFAULT_MAP_REGION_ID);
    const next = await refreshProgress();

    if (ok && next.status === 'finished') {
      setIsInstalled(true);
    }

    return ok;
  }, [refreshProgress]);

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

      const installed = await MwmEngineModule.listInstalledRegions();
      const hasRegion = installed.some((region) => region.id === DEFAULT_MAP_REGION_ID);

      if (!active) {
        return;
      }

      setIsInstalled(hasRegion);
      setIsReady(true);
      await refreshProgress();

      if (!hasRegion && !downloadStarted.current) {
        downloadStarted.current = true;
        void startDownload();
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [refreshProgress, startDownload]);

  useEffect(() => {
    if (!isReady || isInstalled || progress.status !== 'downloading') {
      return;
    }

    const timer = setInterval(() => {
      void refreshProgress().then((next) => {
        if (next.status === 'finished') {
          setIsInstalled(true);
        }
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, [isInstalled, isReady, progress.status, refreshProgress]);

  const isDownloading = progress.status === 'downloading';

  return {
    isReady,
    isInstalled,
    isDownloading,
    progress,
    retryDownload: startDownload,
  };
}
