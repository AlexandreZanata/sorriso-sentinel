export interface ValidationVoteSummary {
  voterReputationIds: ReadonlySet<string>;
}

export class DuplicateVoteError extends Error {
  constructor() {
    super('Contributor has already voted on this occurrence');
    this.name = 'DuplicateVoteError';
  }
}

export class DuplicateVotePolicy {
  hasAlreadyVoted(
    votes: ValidationVoteSummary,
    voterReputationId: string,
  ): boolean {
    return votes.voterReputationIds.has(voterReputationId);
  }

  assertNoDuplicateVote(
    votes: ValidationVoteSummary,
    voterReputationId: string,
  ): void {
    if (this.hasAlreadyVoted(votes, voterReputationId)) {
      throw new DuplicateVoteError();
    }
  }
}
