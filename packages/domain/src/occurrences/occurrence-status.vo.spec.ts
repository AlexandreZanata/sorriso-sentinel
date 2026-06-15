import { describe, expect, it } from 'vitest';
import {
  InvalidOccurrenceStatusError,
  parseOccurrenceStatus,
} from './occurrence-status.vo.js';

describe('parseOccurrenceStatus', () => {
  it('should_accept_valid_status_unverified', () => {
    expect(parseOccurrenceStatus('unverified')).toBe('unverified');
  });

  it('should_accept_valid_status_resolved', () => {
    expect(parseOccurrenceStatus('resolved')).toBe('resolved');
  });

  it('should_reject_invalid_status', () => {
    expect(() => parseOccurrenceStatus('invalid')).toThrow(
      InvalidOccurrenceStatusError,
    );
  });
});
