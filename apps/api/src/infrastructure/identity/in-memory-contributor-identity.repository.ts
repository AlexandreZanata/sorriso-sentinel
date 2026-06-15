import type {
  ContributorIdentity,
  ContributorIdentityRepositoryPort,
} from '@sorriso-sentinel/domain';

export class InMemoryContributorIdentityRepository
  implements ContributorIdentityRepositoryPort
{
  private readonly byId = new Map<string, ContributorIdentity>();
  private readonly byLocalKey = new Map<string, ContributorIdentity>();

  async save(identity: ContributorIdentity): Promise<void> {
    this.byId.set(`${identity.cityId}:${identity.id}`, identity);
    this.byLocalKey.set(
      `${identity.cityId}:${identity.localKeyRef}`,
      identity,
    );
  }

  async findById(
    id: string,
    cityId: string,
  ): Promise<ContributorIdentity | null> {
    return this.byId.get(`${cityId}:${id}`) ?? null;
  }

  async findByLocalKeyRef(
    localKeyRef: string,
    cityId: string,
  ): Promise<ContributorIdentity | null> {
    return this.byLocalKey.get(`${cityId}:${localKeyRef}`) ?? null;
  }
}
