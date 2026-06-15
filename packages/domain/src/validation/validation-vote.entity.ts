import type { ContributorRef } from '../identity/value-objects/contributor-ref.vo.js';
import { parseReputationId } from '../identity/value-objects/reputation-id.vo.js';
import {
  DuplicateVotePolicy,
  type ValidationVoteSummary,
} from './services/duplicate-vote.policy.js';
import {
  SelfValidationForbiddenError,
  SelfValidationPolicy,
} from './services/self-validation.policy.js';
import { parseValidationReason } from './value-objects/validation-reason.vo.js';
import {
  parseValidationVoteType,
  type ValidationVoteType,
} from './value-objects/validation-vote-type.vo.js';
import { parseTrustWeight } from './value-objects/trust-weight.vo.js';

export interface ValidationVoteProps {
  id: string;
  occurrenceId: string;
  cityId: string;
  voterReputationId: string;
  voteType: ValidationVoteType;
  reason: string | null;
  trustWeightApplied: number;
  createdAt: Date;
}

export class InvalidValidationVoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidValidationVoteError';
  }
}

export class ValidationVote {
  private constructor(private readonly props: ValidationVoteProps) {}

  static cast(params: {
    id: string;
    occurrenceId: string;
    cityId: string;
    voter: ContributorRef;
    authorReputationId: string;
    voteType: ValidationVoteType | string;
    reason?: string | null;
    trustWeight: number;
    existingVotes: ValidationVoteSummary;
    selfValidationPolicy?: SelfValidationPolicy;
    duplicateVotePolicy?: DuplicateVotePolicy;
    clock: () => Date;
  }): ValidationVote {
    if (!params.occurrenceId?.trim()) {
      throw new InvalidValidationVoteError('Occurrence id is required');
    }

    if (!params.cityId?.trim()) {
      throw new InvalidValidationVoteError('City id is required');
    }

    const voterReputationId = parseReputationId(params.voter.reputationId);
    const authorReputationId = parseReputationId(params.authorReputationId);
    const voteType = parseValidationVoteType(params.voteType);
    const trustWeightApplied = parseTrustWeight(params.trustWeight);
    const reason = parseValidationReason(voteType, params.reason);

    const selfValidationPolicy =
      params.selfValidationPolicy ?? new SelfValidationPolicy();
    const duplicateVotePolicy =
      params.duplicateVotePolicy ?? new DuplicateVotePolicy();

    if (
      !selfValidationPolicy.canVote(authorReputationId, voterReputationId)
    ) {
      throw new SelfValidationForbiddenError();
    }

    duplicateVotePolicy.assertNoDuplicateVote(
      params.existingVotes,
      voterReputationId,
    );

    return new ValidationVote({
      id: params.id,
      occurrenceId: params.occurrenceId,
      cityId: params.cityId,
      voterReputationId,
      voteType,
      reason,
      trustWeightApplied,
      createdAt: params.clock(),
    });
  }

  static rehydrate(props: ValidationVoteProps): ValidationVote {
    return new ValidationVote({
      ...props,
      voterReputationId: parseReputationId(props.voterReputationId),
      voteType: parseValidationVoteType(props.voteType),
      trustWeightApplied: parseTrustWeight(props.trustWeightApplied),
      reason: parseValidationReason(props.voteType, props.reason),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get occurrenceId(): string {
    return this.props.occurrenceId;
  }

  get cityId(): string {
    return this.props.cityId;
  }

  get voterReputationId(): string {
    return this.props.voterReputationId;
  }

  get voteType(): ValidationVoteType {
    return this.props.voteType;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  get trustWeightApplied(): number {
    return this.props.trustWeightApplied;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toProps(): ValidationVoteProps {
    return { ...this.props };
  }
}
