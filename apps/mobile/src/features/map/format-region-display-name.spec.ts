import { describe, expect, it } from 'vitest';
import { formatRegionDisplayName } from './format-region-display-name';

describe('formatRegionDisplayName', () => {
  it('should_format_brazil_region_ids', () => {
    expect(formatRegionDisplayName('Brazil_Mato Grosso')).toBe('Mato Grosso, Brazil');
  });
});
