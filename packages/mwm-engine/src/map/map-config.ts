import { DEFAULT_MAP_CENTER } from '../downloader/constants';

/** Map viewport defaults aligned with CoMaps city-level browsing. */
export const MAP_CONFIG = {
  center: DEFAULT_MAP_CENTER,
  /** Initial zoom — street/neighborhood level for Sorriso. */
  initialZoom: 13,
  minZoom: 4,
  maxZoom: 19,
  /** Debounce before refetching occurrences after pan/zoom (ms). */
  boundsDebounceMs: 400,
} as const;

export interface MapViewportBounds {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}

export const SORRISO_DEFAULT_BOUNDS: MapViewportBounds = {
  minLatitude: -12.58,
  maxLatitude: -12.51,
  minLongitude: -55.76,
  maxLongitude: -55.68,
};
