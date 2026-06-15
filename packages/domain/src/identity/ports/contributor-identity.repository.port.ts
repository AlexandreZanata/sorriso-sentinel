import type { ContributorIdentity } from '../contributor-identity.entity.js';

export interface ContributorIdentityRepositoryPort {
  save(identity: ContributorIdentity): Promise<void>;
  findById(id: string, cityId: string): Promise<ContributorIdentity | null>;
  findByLocalKeyRef(
    localKeyRef: string,
    cityId: string,
  ): Promise<ContributorIdentity | null>;
}

export const CONTRIBUTOR_IDENTITY_REPOSITORY = Symbol(
  'CONTRIBUTOR_IDENTITY_REPOSITORY',
);
