import { Inject, Injectable } from '@nestjs/common';
import {
  ContributorIdentity,
  type ContributorIdentityProps,
  type ContributorIdentityRepositoryPort,
} from '@sorriso-sentinel/domain';
import type Redis from 'ioredis';
import {
  CONTRIBUTOR_SESSION_TTL_SECONDS,
  REDIS_CLIENT,
} from './redis.tokens';

interface StoredContributorProps {
  id: string;
  cityId: string;
  reputationId: string;
  identityMode: ContributorIdentityProps['identityMode'];
  pseudonym: string | null;
  publicProfileId: string | null;
  localKeyRef: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class RedisContributorIdentityRepository
  implements ContributorIdentityRepositoryPort
{
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async save(identity: ContributorIdentity): Promise<void> {
    const props = identity.toProps();
    const payload: StoredContributorProps = {
      ...props,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
    const serialized = JSON.stringify(payload);

    await this.redis
      .multi()
      .set(this.idKey(props.cityId, props.id), serialized, 'EX', CONTRIBUTOR_SESSION_TTL_SECONDS)
      .set(
        this.localKey(props.cityId, props.localKeyRef),
        serialized,
        'EX',
        CONTRIBUTOR_SESSION_TTL_SECONDS,
      )
      .exec();
  }

  async findById(
    id: string,
    cityId: string,
  ): Promise<ContributorIdentity | null> {
    const raw = await this.redis.get(this.idKey(cityId, id));
    return this.deserialize(raw);
  }

  async findByLocalKeyRef(
    localKeyRef: string,
    cityId: string,
  ): Promise<ContributorIdentity | null> {
    const raw = await this.redis.get(this.localKey(cityId, localKeyRef));
    return this.deserialize(raw);
  }

  private idKey(cityId: string, id: string): string {
    return `sentinel:contributor:id:${cityId}:${id}`;
  }

  private localKey(cityId: string, localKeyRef: string): string {
    return `sentinel:contributor:local:${cityId}:${localKeyRef}`;
  }

  private deserialize(raw: string | null): ContributorIdentity | null {
    if (!raw) {
      return null;
    }

    try {
      const stored = JSON.parse(raw) as StoredContributorProps;

      return ContributorIdentity.rehydrate({
        id: stored.id,
        cityId: stored.cityId,
        reputationId: stored.reputationId,
        identityMode: stored.identityMode,
        pseudonym: stored.pseudonym,
        publicProfileId: stored.publicProfileId,
        localKeyRef: stored.localKeyRef,
        version: stored.version,
        createdAt: new Date(stored.createdAt),
        updatedAt: new Date(stored.updatedAt),
      });
    } catch {
      return null;
    }
  }
}
