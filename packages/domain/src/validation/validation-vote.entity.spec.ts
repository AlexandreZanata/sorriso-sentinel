import { describe, expect, it } from 'vitest';
import { DuplicateVoteError } from './services/duplicate-vote.policy.js';
import { SelfValidationForbiddenError } from './services/self-validation.policy.js';
import { ValidationVote } from './validation-vote.entity.js';

describe('ValidationVote', () => {
  const clock = () => new Date('2026-06-15T12:00:00Z');
  const emptyVotes = { voterReputationIds: new Set<string>() };

  const baseParams = {
    id: 'vote-1',
    occurrenceId: 'occurrence-1',
    cityId: 'city-1',
    voter: { reputationId: 'Rep-VOTR1' },
    authorReputationId: 'Rep-AUTH1',
    voteType: 'confirm' as const,
    trustWeight: 1.0,
    existingVotes: emptyVotes,
    clock,
  };

  it('should_create_confirm_vote_with_valid_params', () => {
    const vote = ValidationVote.cast({
      ...baseParams,
      reason: 'still_there',
    });

    expect(vote.voteType).toBe('confirm');
    expect(vote.voterReputationId).toBe('Rep-VOTR1');
    expect(vote.trustWeightApplied).toBe(1);
    expect(vote.reason).toBe('still_there');
  });

  it('should_create_deny_vote_with_valid_params', () => {
    const vote = ValidationVote.cast({
      ...baseParams,
      voteType: 'deny',
      reason: 'false_alarm',
    });

    expect(vote.voteType).toBe('deny');
    expect(vote.reason).toBe('false_alarm');
  });

  it('should_reject_self_validation_vote', () => {
    expect(() =>
      ValidationVote.cast({
        ...baseParams,
        voter: { reputationId: 'Rep-AUTH1' },
        authorReputationId: 'Rep-AUTH1',
      }),
    ).toThrow(SelfValidationForbiddenError);
  });

  it('should_reject_duplicate_vote', () => {
    expect(() =>
      ValidationVote.cast({
        ...baseParams,
        existingVotes: { voterReputationIds: new Set(['Rep-VOTR1']) },
      }),
    ).toThrow(DuplicateVoteError);
  });

  it('should_reject_invalid_trust_weight', () => {
    expect(() =>
      ValidationVote.cast({
        ...baseParams,
        trustWeight: 2,
      }),
    ).toThrow(/Invalid trust weight/);
  });
});
