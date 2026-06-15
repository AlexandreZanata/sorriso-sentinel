import { describe, expect, it } from 'vitest';
import {
  isConfirmVote,
  isDenyVote,
  parseValidationVoteType,
} from './validation-vote-type.vo.js';

describe('ValidationVoteType', () => {
  it('should_parse_confirm_vote_type', () => {
    expect(parseValidationVoteType('confirm')).toBe('confirm');
    expect(isConfirmVote('confirm')).toBe(true);
  });

  it('should_parse_deny_vote_type', () => {
    expect(parseValidationVoteType('deny')).toBe('deny');
    expect(isDenyVote('deny')).toBe(true);
  });

  it('should_reject_invalid_vote_type', () => {
    expect(() => parseValidationVoteType('rating')).toThrow(
      /Invalid validation vote type/,
    );
  });
});
