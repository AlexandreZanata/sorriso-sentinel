import { describe, expect, it } from 'vitest';
import { formatByteSize } from './format-byte-size';

describe('formatByteSize', () => {
  it('should_format_megabytes', () => {
    expect(formatByteSize(91_739_487)).toBe('87.5 MB');
  });
});
