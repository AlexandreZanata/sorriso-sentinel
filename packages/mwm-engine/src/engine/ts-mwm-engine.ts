import type {
  MwmDownloadProgress,
  MwmEngineInitOptions,
  MwmRegionDescriptor,
} from '../types';
import { MapRegionDownloader } from '../downloader/map-region-downloader';

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
