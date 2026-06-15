import { describe, expect, it } from 'vitest';
import {
  SelfValidationForbiddenError,
  SelfValidationPolicy,
} from './self-validation.policy.js';

describe('SelfValidationPolicy', () => {
  const policy = new SelfValidationPolicy();
  const authorReputationId = 'Rep-ABCDE';
  const voterReputationId = 'Rep-FGHIJ';

  it('should_forbid_self_confirmation', () => {
    expect(policy.canVote(authorReputationId, authorReputationId)).toBe(false);
    expect(() =>
      policy.assertCanVote(authorReputationId, authorReputationId),
    ).toThrow(SelfValidationForbiddenError);
  });

  it('should_forbid_self_denial', () => {
    expect(policy.canVote(authorReputationId, authorReputationId)).toBe(false);
    expect(() =>
      policy.assertCanVote(authorReputationId, authorReputationId),
    ).toThrow('Contributor cannot validate their own occurrence');
  });

  it('should_allow_vote_when_reputation_ids_differ', () => {
    expect(policy.canVote(authorReputationId, voterReputationId)).toBe(true);
    expect(() =>
      policy.assertCanVote(authorReputationId, voterReputationId),
    ).not.toThrow();
  });
});
