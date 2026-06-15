import { describe, expect, it } from 'vitest';
import {
  defaultOccurrenceKindForCategory,
  parseOccurrenceKind,
} from './occurrence-kind.vo.js';

describe('parseOccurrenceKind', () => {
  it('should_default_occurrence_kind_to_problem', () => {
    expect(defaultOccurrenceKindForCategory('pothole')).toBe('problem');
  });

  it('should_accept_temporary_event_kind_for_fair', () => {
    expect(parseOccurrenceKind('temporary_event')).toBe('temporary_event');
    expect(defaultOccurrenceKindForCategory('fair')).toBe('temporary_event');
  });
});
