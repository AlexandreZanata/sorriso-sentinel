import { MWM_FILE_EXTENSION } from './constants';

/** Legacy mobile layout before ADR-0005 alignment. */
export const LEGACY_MWM_SUBDIR = 'mwm';

/**
 * CoMaps on-disk layout: `{documents}/{dataVersion}/{RegionId}.mwm`
 * See `platform::GetFileDownloadPath` in CoMaps `local_country_file_utils.cpp`.
 */
export function buildCoMapsRegionDirectory(
  documentDirectory: string,
  dataVersion: number,
): string {
  return `${documentDirectory}${dataVersion}/`;
}

export function buildCoMapsRegionFilePath(
  documentDirectory: string,
  dataVersion: number,
  regionId: string,
): string {
  return `${buildCoMapsRegionDirectory(documentDirectory, dataVersion)}${regionId}${MWM_FILE_EXTENSION}`;
}

export function buildLegacyRegionFilePath(
  documentDirectory: string,
  legacySubdir: string,
  regionId: string,
): string {
  return `${documentDirectory}${legacySubdir}/${regionId}${MWM_FILE_EXTENSION}`;
}
