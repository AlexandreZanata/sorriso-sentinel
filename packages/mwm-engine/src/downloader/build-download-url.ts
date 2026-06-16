import { MAPS_BASE_PATH, MAP_SERIES, MWM_FILE_EXTENSION } from './constants';
import { joinUrl } from './join-url';

/** Mirrors CoMaps `downloader::GetFileDownloadUrl` (`downloader_utils.cpp`). */
export function buildMwmDownloadPath(
  regionId: string,
  dataVersion: number,
): string {
  const fileName = `${regionId}${MWM_FILE_EXTENSION}`;
  return joinUrl(
    MAPS_BASE_PATH,
    MAP_SERIES,
    String(dataVersion),
    encodeURIComponent(fileName),
  );
}

export function buildMwmDownloadUrls(
  servers: readonly string[],
  regionId: string,
  dataVersion: number,
): string[] {
  const relativePath = buildMwmDownloadPath(regionId, dataVersion);

  return servers.map((server) => joinUrl(server, relativePath));
}

export function buildCountriesCatalogPath(dataVersion: number): string {
  return joinUrl(MAPS_BASE_PATH, MAP_SERIES, String(dataVersion), 'countries.txt');
}
