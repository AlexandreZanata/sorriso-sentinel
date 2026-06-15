import type { ValidationVoteProps } from '../validation-vote.entity.js';

export interface ValidationVoteRepositoryPort {
  save(vote: ValidationVoteProps): Promise<void>;
  findByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<ValidationVoteProps[]>;
}

export const VALIDATION_VOTE_REPOSITORY = Symbol('VALIDATION_VOTE_REPOSITORY');
