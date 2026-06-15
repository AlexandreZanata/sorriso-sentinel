import { parseReputationId } from './reputation-id.vo.js';

export interface ContributorRef {
  reputationId: string;
}

export class MissingContributorRefError extends Error {
  constructor() {
    super('Contributor reference is required');
    this.name = 'MissingContributorRefError';
  }
}

export function parseContributorRef(value: ContributorRef | null | undefined): ContributorRef {
  if (!value?.reputationId) {
    throw new MissingContributorRefError();
  }

  return {
    reputationId: parseReputationId(value.reputationId),
  };
}
