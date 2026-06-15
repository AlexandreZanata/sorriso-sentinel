import { describe, expect, it } from 'vitest';
import {
  InvalidPrivacyLevelError,
  parsePrivacyLevel,
} from './privacy-level.vo.js';

describe('parsePrivacyLevel', () => {
  it('should_parse_privacy_level_enum', () => {
    expect(parsePrivacyLevel('public')).toBe('public');
    expect(parsePrivacyLevel('approximate')).toBe('approximate');
    expect(parsePrivacyLevel('hidden')).toBe('hidden');
    expect(parsePrivacyLevel('neighborhood')).toBe('neighborhood');
    expect(() => parsePrivacyLevel('secret')).toThrow(InvalidPrivacyLevelError);
  });
});
