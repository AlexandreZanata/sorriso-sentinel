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
} from './engine/ts-mwm-engine';

export const MwmEngineModule = {
  async initializeEngine(options: MwmEngineInitOptions): Promise<boolean> {
    return initializeMwmEngine(options);
  },

  async listInstalledRegions(): Promise<MwmRegionDescriptor[]> {
    return listInstalledMwmRegions();
  },

  async downloadRegion(regionId: string): Promise<boolean> {
    return downloadMwmRegion(regionId);
  },

  async getDownloadProgress(regionId: string): Promise<MwmDownloadProgress> {
    return getMwmDownloadProgress(regionId);
  },

  async getRegionCatalogEntry(regionId: string): Promise<MwmRegionCatalogEntry | null> {
    return getMwmRegionCatalogEntry(regionId);
  },
};
