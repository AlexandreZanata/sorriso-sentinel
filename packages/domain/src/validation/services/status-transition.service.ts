import type { OccurrenceStatus } from '../../occurrences/occurrence-status.vo.js';
import type { ValidationPolicy } from '../value-objects/validation-policy.vo.js';

export class StatusTransitionService {
  static resolveStatus(params: {
    currentStatus: OccurrenceStatus;
    confidence: number;
    distinctConfirms: number;
    weightedConfirmScore: number;
    policy: ValidationPolicy;
    isFirstVoteOnOccurrence: boolean;
  }): OccurrenceStatus {
    const {
      currentStatus,
      confidence,
      distinctConfirms,
      weightedConfirmScore,
      policy,
      isFirstVoteOnOccurrence,
    } = params;

    if (currentStatus === 'resolved' || currentStatus === 'evolved') {
      return currentStatus;
    }

    if (currentStatus === 'unverified' && isFirstVoteOnOccurrence) {
      return 'under_review';
    }

    const meetsActiveThreshold =
      distinctConfirms >= policy.minDistinctConfirmations &&
      weightedConfirmScore >= policy.minWeightedScore &&
      confidence > policy.confidenceFloor;

    if (meetsActiveThreshold) {
      return 'active';
    }

    if (
      confidence < policy.confidenceFloor &&
      (currentStatus === 'under_review' || currentStatus === 'active')
    ) {
      return 'low_confidence';
    }

    return currentStatus === 'unverified' ? 'under_review' : currentStatus;
  }
}
