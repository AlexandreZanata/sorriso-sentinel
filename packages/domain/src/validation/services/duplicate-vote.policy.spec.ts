import { describe, expect, it } from 'vitest';
import {
  DuplicateVoteError,
  DuplicateVotePolicy,
} from './duplicate-vote.policy.js';

describe('DuplicateVotePolicy', () => {
  const policy = new DuplicateVotePolicy();

  it('should_detect_duplicate_vote', () => {
    const votes = {
      voterReputationIds: new Set(['Rep-ABCDE', 'Rep-FGHIJ']),
    };

    expect(policy.hasAlreadyVoted(votes, 'Rep-ABCDE')).toBe(true);
    expect(() => policy.assertNoDuplicateVote(votes, 'Rep-ABCDE')).toThrow(
      DuplicateVoteError,
    );
  });

  it('should_allow_first_vote_from_contributor', () => {
    const votes = {
      voterReputationIds: new Set(['Rep-ABCDE']),
    };

    expect(policy.hasAlreadyVoted(votes, 'Rep-FGHIJ')).toBe(false);
    expect(() => policy.assertNoDuplicateVote(votes, 'Rep-FGHIJ')).not.toThrow();
  });
});
