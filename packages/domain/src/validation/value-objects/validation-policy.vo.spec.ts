import { describe, expect, it } from 'vitest';
import {
  defaultValidationPolicy,
  resolveValidationPolicy,
} from './validation-policy.vo.js';

describe('ValidationPolicy', () => {
  it('should_parse_validation_policy_defaults', () => {
    const standard = defaultValidationPolicy();

    expect(standard).toEqual({
      confirmBasePoints: 20,
      denyBasePoints: 25,
      minDistinctConfirmations: 5,
      minWeightedScore: 100,
      confidenceFloor: 20,
    });

    expect(
      resolveValidationPolicy({
        isSensitive: true,
        occurrenceKind: 'problem',
      }),
    ).toEqual({
      confirmBasePoints: 20,
      denyBasePoints: 25,
      minDistinctConfirmations: 8,
      minWeightedScore: 160,
      confidenceFloor: 15,
    });

    expect(
      resolveValidationPolicy({
        isSensitive: false,
        occurrenceKind: 'temporary_event',
      }),
    ).toEqual({
      confirmBasePoints: 20,
      denyBasePoints: 25,
      minDistinctConfirmations: 3,
      minWeightedScore: 60,
      confidenceFloor: 20,
    });
  });
});
