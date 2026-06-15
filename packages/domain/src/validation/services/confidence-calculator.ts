import { parseConfidenceLevel } from '../../occurrences/value-objects/confidence-level.vo.js';
import type { ValidationPolicy } from '../value-objects/validation-policy.vo.js';
import type { ValidationVoteType } from '../value-objects/validation-vote-type.vo.js';
import { parseTrustWeight } from '../value-objects/trust-weight.vo.js';

export class ConfidenceCalculator {
  static calculate(params: {
    currentLevel: number;
    voteType: ValidationVoteType;
    trustWeight: number;
    policy: ValidationPolicy;
  }): number {
    const weight = parseTrustWeight(params.trustWeight);
    const basePoints =
      params.voteType === 'confirm'
        ? params.policy.confirmBasePoints
        : -params.policy.denyBasePoints;
    const nextLevel = params.currentLevel + Math.round(basePoints * weight);

    return parseConfidenceLevel(Math.min(100, Math.max(0, nextLevel)));
  }
}
