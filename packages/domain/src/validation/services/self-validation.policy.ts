export class SelfValidationForbiddenError extends Error {
  constructor() {
    super('Contributor cannot validate their own occurrence');
    this.name = 'SelfValidationForbiddenError';
  }
}

export class SelfValidationPolicy {
  canVote(authorReputationId: string, voterReputationId: string): boolean {
    return authorReputationId !== voterReputationId;
  }

  assertCanVote(authorReputationId: string, voterReputationId: string): void {
    if (!this.canVote(authorReputationId, voterReputationId)) {
      throw new SelfValidationForbiddenError();
    }
  }
}

export function canValidateOccurrence(
  authorReputationId: string,
  voterReputationId: string,
  policy: SelfValidationPolicy = new SelfValidationPolicy(),
): boolean {
  return policy.canVote(authorReputationId, voterReputationId);
}
