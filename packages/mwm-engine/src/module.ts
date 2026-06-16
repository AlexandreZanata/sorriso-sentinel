import type {
  MwmDownloadProgress,
  MwmEngineInitOptions,
  MwmRegionCatalogEntry,
  MwmRegionDescriptor,
} from './types';
import {
  downloadMwmRegion,
  getMwmDownloadProgress,
  getMwmRegionCatalogEntry,
  initializeMwmEngine,
  listInstalledMwmRegions,
  reloadInstalledMwmMaps,
} from './engine/ts-mwm-engine';
import {
  getNativeMwmEngineModule,
  isNativeMapEngineAvailable,
  mapNativePlacePagePayload,
} from './engine/native-module';
import type { MwmPlacePage } from './types/place-page';

export const MwmEngineModule = {
  isNativeMapAvailable(): boolean {
    return isNativeMapEngineAvailable();
  },

  async initializeEngine(options: MwmEngineInitOptions): Promise<boolean> {
    const native = getNativeMwmEngineModule();

    if (native?.isNativeMapAvailable()) {
      const initialized = await native.initializeEngine(
        options as unknown as Record<string, unknown>,
      );

      if (!initialized) {
        return false;
      }

      const writablePath = await native.getWritableMapsPath();

      return initializeMwmEngine({
        ...options,
        writablePath: writablePath || options.writablePath,
      });
    }

    return initializeMwmEngine(options);
  },

  async listInstalledRegions(): Promise<MwmRegionDescriptor[]> {
    return listInstalledMwmRegions();
  },

  async downloadRegion(regionId: string): Promise<boolean> {
    const native = getNativeMwmEngineModule();

    if (native?.isNativeMapAvailable()) {
      const started = await native.downloadRegion(regionId);

      if (started) {
        await reloadInstalledMwmMaps();
      }

      return started;
    }

    const finished = await downloadMwmRegion(regionId);

    if (finished) {
      await reloadInstalledMwmMaps();
    }

    return finished;
  },

  async getDownloadProgress(regionId: string): Promise<MwmDownloadProgress> {
    return getMwmDownloadProgress(regionId);
  },

  async getRegionCatalogEntry(regionId: string): Promise<MwmRegionCatalogEntry | null> {
    return getMwmRegionCatalogEntry(regionId);
  },

  async reloadInstalledMaps(): Promise<boolean> {
    return reloadInstalledMwmMaps();
  },

  addPlacePageListener(listener: (place: MwmPlacePage | null) => void): () => void {
    const native = getNativeMwmEngineModule();

    if (!native) {
      return () => undefined;
    }

    const activatedSub = native.addListener(
      'onPlacePageActivated',
      (event: Record<string, unknown>) => {
        listener(mapNativePlacePagePayload(event));
      },
    );
    const deactivatedSub = native.addListener('onPlacePageDeactivated', () => {
      listener(null);
    });

    return () => {
      activatedSub.remove();
      deactivatedSub.remove();
    };
  },
};
