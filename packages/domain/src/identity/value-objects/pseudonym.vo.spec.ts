import { describe, expect, it } from 'vitest';
import { InvalidPseudonymError, parsePseudonym } from './pseudonym.vo.js';

describe('Pseudonym', () => {
  it('should_accept_valid_pseudonym', () => {
    expect(parsePseudonym('JoaoDoCentro')).toBe('JoaoDoCentro');
  });

  it('should_reject_pseudonym_shorter_than_3_characters', () => {
    expect(() => parsePseudonym('ab')).toThrow(InvalidPseudonymError);
    expect(() => parsePseudonym('')).toThrow(InvalidPseudonymError);
  });

  it('should_reject_pseudonym_longer_than_32_characters', () => {
    expect(() => parsePseudonym('a'.repeat(33))).toThrow(InvalidPseudonymError);
  });

  it('should_reject_pseudonym_with_doxxing_pattern', () => {
    expect(() => parsePseudonym('user-123.456.789-00')).toThrow(InvalidPseudonymError);
    expect(() => parsePseudonym('11987654321')).toThrow(InvalidPseudonymError);
  });
});
