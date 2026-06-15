import { describe, expect, it } from 'vitest';
import {
  isForcedGhostDisplay,
  parseAuthorDisplayPolicy,
} from './author-display-policy.vo.js';

describe('AuthorDisplayPolicy', () => {
  it('should_parse_all_policy_values', () => {
    expect(parseAuthorDisplayPolicy('ghost')).toBe('ghost');
    expect(parseAuthorDisplayPolicy('pseudonym')).toBe('pseudonym');
    expect(parseAuthorDisplayPolicy('public')).toBe('public');
    expect(parseAuthorDisplayPolicy('forced_ghost')).toBe('forced_ghost');
  });

  it('should_identify_forced_ghost_display', () => {
    expect(isForcedGhostDisplay('forced_ghost')).toBe(true);
    expect(isForcedGhostDisplay('ghost')).toBe(true);
    expect(isForcedGhostDisplay('pseudonym')).toBe(false);
    expect(isForcedGhostDisplay('public')).toBe(false);
  });
});
