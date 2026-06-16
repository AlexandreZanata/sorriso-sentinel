import type {
  MwmDownloadProgress,
  MwmEngineInitOptions,
  MwmRegionCatalogEntry,
  MwmRegionDescriptor,
} from '../types';
import { MapRegionDownloader } from '../downloader/map-region-downloader';
import { getNativeMwmEngineModule } from './native-module';

const downloader = new MapRegionDownloader();

export async function initializeMwmEngine(
  options: MwmEngineInitOptions,
): Promise<boolean> {
  return downloader.initialize(options);
}

export async function listInstalledMwmRegions(): Promise<MwmRegionDescriptor[]> {
  return downloader.listInstalledRegions();
}

export async function downloadMwmRegion(regionId: string): Promise<boolean> {
  return downloader.downloadRegion(regionId);
}

export function getMwmDownloadProgress(regionId: string): MwmDownloadProgress {
  return downloader.getDownloadProgress(regionId);
}

export async function getMwmRegionCatalogEntry(
  regionId: string,
): Promise<MwmRegionCatalogEntry | null> {
  return downloader.getRegionCatalogEntry(regionId);
}

export async function reloadInstalledMwmMaps(): Promise<boolean> {
  const native = getNativeMwmEngineModule();

  if (native?.isNativeMapAvailable()) {
    return native.reloadInstalledMaps();
  }

  return true;
}
