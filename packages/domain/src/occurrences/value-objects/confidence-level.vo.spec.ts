import { describe, expect, it } from 'vitest';
import {
  InvalidConfidenceLevelError,
  parseInitialConfidenceLevel,
} from './confidence-level.vo.js';

describe('parseInitialConfidenceLevel', () => {
  it('should_reject_confidence_level_not_zero_on_create', () => {
    expect(parseInitialConfidenceLevel(0)).toBe(0);
    expect(() => parseInitialConfidenceLevel(1)).toThrow(InvalidConfidenceLevelError);
  });
});
