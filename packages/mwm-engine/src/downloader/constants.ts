/** Mirrors CoMaps `private.h` / `defines.hpp` map CDN settings. */
export const METASERVER_URL = 'https://cdn-us-1.comaps.app';
export const MAP_SERIES = '2026.04.05';
/** Current CoMaps data version from `data/countries.txt` (`v` field). */
export const DEFAULT_DATA_VERSION = 260603;
/** Sent to metaserver as `X-OM-AppVersion` (CoMaps `map_files_downloader.cpp`). */
export const MWM_ENGINE_APP_VERSION = '0.1.0';
export const MAPS_BASE_PATH = 'maps';
export const MWM_FILE_EXTENSION = '.mwm';

export const DEFAULT_CDN_SERVERS: readonly string[] = [
  'https://comaps.firewall-gateway.de/',
  'https://cdn-us-2.comaps.tech/',
  'https://cdn-fi-1.comaps.app/',
  'https://comaps.openstreetmap.fr/',
  'https://comaps-it1.unfoxo.it/',
  'https://comaps-cdn.s3-website.cloud.ru/',
  'https://mapgen-fi-1.comaps.app/',
] as const;

export const DEFAULT_MAP_CENTER = {
  latitude: -12.5423,
  longitude: -55.7214,
} as const;
