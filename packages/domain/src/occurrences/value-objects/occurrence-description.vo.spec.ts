import { describe, expect, it } from 'vitest';
import {
  InvalidOccurrenceDescriptionError,
  parseOccurrenceDescription,
} from './occurrence-description.vo.js';

describe('parseOccurrenceDescription', () => {
  it('should_reject_description_longer_than_2000_chars', () => {
    expect(parseOccurrenceDescription('valid text')).toBe('valid text');
    expect(() => parseOccurrenceDescription('a'.repeat(2001))).toThrow(
      InvalidOccurrenceDescriptionError,
    );
  });
});
