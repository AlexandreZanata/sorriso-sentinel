import { describe, expect, it } from 'vitest';
import {
  InvalidOccurrenceCategoryError,
  parseOccurrenceCategory,
} from './occurrence-category.vo.js';

describe('parseOccurrenceCategory', () => {
  it('should_accept_pothole_as_valid_category', () => {
    expect(parseOccurrenceCategory('pothole')).toBe('pothole');
  });

  it('should_reject_unknown_category', () => {
    expect(() => parseOccurrenceCategory('unknown')).toThrow(InvalidOccurrenceCategoryError);
  });
});
