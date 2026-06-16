import { describe, expect, it } from 'vitest';
import {
  buildCountriesCatalogPath,
  buildMwmDownloadPath,
  buildMwmDownloadUrls,
} from './build-download-url';

describe('buildMwmDownloadPath', () => {
  it('should_build_relative_path_like_comaps', () => {
    expect(buildMwmDownloadPath('Brazil_Mato Grosso', 260603)).toBe(
      'maps/2026.04.05/260603/Brazil_Mato%20Grosso.mwm',
    );
  });
});

describe('buildMwmDownloadUrls', () => {
  it('should_prefix_each_cdn_server', () => {
    const urls = buildMwmDownloadUrls(
      ['https://cdn-fi-1.comaps.app/'],
      'Brazil_Mato Grosso',
      260603,
    );

    expect(urls).toEqual([
      'https://cdn-fi-1.comaps.app/maps/2026.04.05/260603/Brazil_Mato%20Grosso.mwm',
    ]);
  });
});

describe('buildCountriesCatalogPath', () => {
  it('should_point_to_countries_txt', () => {
    expect(buildCountriesCatalogPath(260603)).toBe(
      'maps/2026.04.05/260603/countries.txt',
    );
  });
});
