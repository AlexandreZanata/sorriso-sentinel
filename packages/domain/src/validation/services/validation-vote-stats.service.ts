import type { ValidationVoteProps } from '../validation-vote.entity.js';
import type { ValidationVoteSummary } from './duplicate-vote.policy.js';
import type { ValidationPolicy } from '../value-objects/validation-policy.vo.js';

export interface ValidationVoteStats {
  distinctConfirms: number;
  distinctDenials: number;
  weightedConfirmScore: number;
  totalVoteCount: number;
  summary: ValidationVoteSummary;
}

export function computeValidationVoteStats(
  votes: ValidationVoteProps[],
  policy: ValidationPolicy,
): ValidationVoteStats {
  const voterReputationIds = new Set<string>();
  let distinctConfirms = 0;
  let distinctDenials = 0;
  let weightedConfirmScore = 0;

  for (const vote of votes) {
    voterReputationIds.add(vote.voterReputationId);

    if (vote.voteType === 'confirm') {
      distinctConfirms += 1;
      weightedConfirmScore +=
        policy.confirmBasePoints * vote.trustWeightApplied;
    } else {
      distinctDenials += 1;
    }
  }

  return {
    distinctConfirms,
    distinctDenials,
    weightedConfirmScore,
    totalVoteCount: votes.length,
    summary: { voterReputationIds },
  };
}
