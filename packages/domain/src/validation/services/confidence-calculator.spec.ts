import { describe, expect, it } from 'vitest';
import { ConfidenceCalculator } from './confidence-calculator.js';
import { StatusTransitionService } from './status-transition.service.js';
import { defaultValidationPolicy, resolveValidationPolicy } from '../value-objects/validation-policy.vo.js';
import { fullTrustWeight, newContributorTrustWeight } from '../value-objects/trust-weight.vo.js';

describe('ConfidenceCalculator', () => {
  const policy = defaultValidationPolicy();

  it('should_increase_confidence_on_confirm_with_full_weight', () => {
    expect(
      ConfidenceCalculator.calculate({
        currentLevel: 0,
        voteType: 'confirm',
        trustWeight: fullTrustWeight(),
        policy,
      }),
    ).toBe(20);
  });

  it('should_decrease_confidence_on_deny', () => {
    expect(
      ConfidenceCalculator.calculate({
        currentLevel: 50,
        voteType: 'deny',
        trustWeight: fullTrustWeight(),
        policy,
      }),
    ).toBe(25);
  });

  it('should_clamp_confidence_at_zero', () => {
    expect(
      ConfidenceCalculator.calculate({
        currentLevel: 10,
        voteType: 'deny',
        trustWeight: fullTrustWeight(),
        policy,
      }),
    ).toBe(0);
  });

  it('should_clamp_confidence_at_100', () => {
    expect(
      ConfidenceCalculator.calculate({
        currentLevel: 95,
        voteType: 'confirm',
        trustWeight: fullTrustWeight(),
        policy,
      }),
    ).toBe(100);
  });

  it('should_apply_reduced_weight_for_new_reputation', () => {
    expect(
      ConfidenceCalculator.calculate({
        currentLevel: 0,
        voteType: 'confirm',
        trustWeight: newContributorTrustWeight(),
        policy,
      }),
    ).toBe(10);
  });
});

describe('StatusTransitionService', () => {
  const policy = defaultValidationPolicy();
  const sensitivePolicy = resolveValidationPolicy({
    isSensitive: true,
    occurrenceKind: 'problem',
  });

  it('should_transition_unverified_to_under_review_on_first_vote', () => {
    expect(
      StatusTransitionService.resolveStatus({
        currentStatus: 'unverified',
        confidence: 20,
        distinctConfirms: 1,
        weightedConfirmScore: 20,
        policy,
        isFirstVoteOnOccurrence: true,
      }),
    ).toBe('under_review');
  });

  it('should_not_promote_to_active_with_single_confirm', () => {
    expect(
      StatusTransitionService.resolveStatus({
        currentStatus: 'under_review',
        confidence: 20,
        distinctConfirms: 1,
        weightedConfirmScore: 20,
        policy,
        isFirstVoteOnOccurrence: false,
      }),
    ).toBe('under_review');
  });

  it('should_promote_to_active_when_threshold_met', () => {
    expect(
      StatusTransitionService.resolveStatus({
        currentStatus: 'under_review',
        confidence: 100,
        distinctConfirms: 5,
        weightedConfirmScore: 100,
        policy,
        isFirstVoteOnOccurrence: false,
      }),
    ).toBe('active');
  });

  it('should_transition_to_low_confidence_when_below_floor', () => {
    expect(
      StatusTransitionService.resolveStatus({
        currentStatus: 'under_review',
        confidence: 10,
        distinctConfirms: 1,
        weightedConfirmScore: 20,
        policy,
        isFirstVoteOnOccurrence: false,
      }),
    ).toBe('low_confidence');
  });

  it('should_use_higher_threshold_for_sensitive_category', () => {
    expect(
      StatusTransitionService.resolveStatus({
        currentStatus: 'under_review',
        confidence: 100,
        distinctConfirms: 5,
        weightedConfirmScore: 100,
        policy: sensitivePolicy,
        isFirstVoteOnOccurrence: false,
      }),
    ).toBe('under_review');

    expect(
      StatusTransitionService.resolveStatus({
        currentStatus: 'under_review',
        confidence: 160,
        distinctConfirms: 8,
        weightedConfirmScore: 160,
        policy: sensitivePolicy,
        isFirstVoteOnOccurrence: false,
      }),
    ).toBe('active');
  });
});
