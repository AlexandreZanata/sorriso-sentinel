import { describe, expect, it } from 'vitest';
import { buildCoMapsRegionDirectory, buildCoMapsRegionFilePath } from './comaps-storage';

describe('comaps-storage', () => {
  it('should_build_versioned_region_path', () => {
    expect(buildCoMapsRegionDirectory('file:///data/', 260603)).toBe('file:///data/260603/');
    expect(buildCoMapsRegionFilePath('file:///data/', 260603, 'Brazil_Mato Grosso')).toBe(
      'file:///data/260603/Brazil_Mato Grosso.mwm',
    );
  });
});
