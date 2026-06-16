import { describe, expect, it } from 'vitest';
import { parseCountriesCatalog } from './parse-countries-catalog';

describe('parseCountriesCatalog', () => {
  it('should_index_leaf_regions_by_id', () => {
    const catalog = parseCountriesCatalog(
      JSON.stringify({
        id: 'Countries',
        v: 260603,
        map_series: '2026.04.05',
        g: [
          {
            id: 'Brazil_Mato Grosso',
            s: 91739487,
            sha1_base64: '9UgXuqS1kr7G/nAr84B/lKFwTdw=',
          },
        ],
      }),
    );

    expect(catalog?.dataVersion).toBe(260603);
    expect(catalog?.mapSeries).toBe('2026.04.05');
    expect(catalog?.regions.get('Brazil_Mato Grosso')).toEqual({
      id: 'Brazil_Mato Grosso',
      sizeBytes: 91739487,
      sha1Base64: '9UgXuqS1kr7G/nAr84B/lKFwTdw=',
    });
  });
});
