import { describe, expect, it } from 'vitest';
import {
  fullTrustWeight,
  newContributorTrustWeight,
  parseTrustWeight,
} from './trust-weight.vo.js';

describe('TrustWeight', () => {
  it('should_accept_full_trust_weight', () => {
    expect(parseTrustWeight(fullTrustWeight())).toBe(1);
  });

  it('should_accept_new_contributor_reduced_weight', () => {
    expect(parseTrustWeight(newContributorTrustWeight())).toBe(0.5);
  });

  it('should_reject_weight_below_minimum', () => {
    expect(() => parseTrustWeight(0.05)).toThrow(/Invalid trust weight/);
  });

  it('should_reject_weight_above_maximum', () => {
    expect(() => parseTrustWeight(1.5)).toThrow(/Invalid trust weight/);
  });
});
