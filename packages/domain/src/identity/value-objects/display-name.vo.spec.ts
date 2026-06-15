import { describe, expect, it } from 'vitest';
import { parseDisplayName } from './display-name.vo.js';

describe('DisplayName', () => {
  it('should_reject_display_name_shorter_than_2_characters', () => {
    expect(() => parseDisplayName('A')).toThrow(/Invalid display name/);
  });

  it('should_reject_display_name_with_doxxing_pattern', () => {
    expect(() => parseDisplayName('John Smith 123.456.789-00')).toThrow(
      /Invalid display name/,
    );
  });

  it('should_accept_valid_display_name', () => {
    expect(parseDisplayName('Civic Center')).toBe('Civic Center');
  });
});
