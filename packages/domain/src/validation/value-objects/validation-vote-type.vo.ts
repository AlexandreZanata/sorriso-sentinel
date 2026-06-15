export const VALIDATION_VOTE_TYPES = ['confirm', 'deny'] as const;

export type ValidationVoteType = (typeof VALIDATION_VOTE_TYPES)[number];

export class InvalidValidationVoteTypeError extends Error {
  constructor(value: string) {
    super(`Invalid validation vote type: ${value}`);
    this.name = 'InvalidValidationVoteTypeError';
  }
}

export function parseValidationVoteType(value: string): ValidationVoteType {
  if (!VALIDATION_VOTE_TYPES.includes(value as ValidationVoteType)) {
    throw new InvalidValidationVoteTypeError(value);
  }

  return value as ValidationVoteType;
}

export function isConfirmVote(voteType: ValidationVoteType): boolean {
  return voteType === 'confirm';
}

export function isDenyVote(voteType: ValidationVoteType): boolean {
  return voteType === 'deny';
}
