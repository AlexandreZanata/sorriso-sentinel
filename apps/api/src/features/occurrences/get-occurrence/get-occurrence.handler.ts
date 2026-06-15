import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CONTRIBUTOR_IDENTITY_REPOSITORY,
  OccurrenceReadProjection,
  type ContributorIdentityRepositoryPort,
  type OccurrenceReadDto,
} from '@sorriso-sentinel/domain';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { storedOccurrenceToReadSource } from '../../../infrastructure/occurrences/occurrence-read.mapper';
import {
  OCCURRENCE_STORE,
  type OccurrenceStorePort,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';

@Injectable()
export class GetOccurrenceHandler {
  private readonly projection = new OccurrenceReadProjection();

  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
    @Inject(CONTRIBUTOR_IDENTITY_REPOSITORY)
    private readonly contributors: ContributorIdentityRepositoryPort,
  ) {}

  async execute(
    occurrenceId: string,
    session: SessionClaims | undefined,
  ): Promise<OccurrenceReadDto> {
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const stored = await this.occurrences.findById(occurrenceId, session.cityId);

    if (!stored) {
      throw new NotFoundException({ code: 'OCCURRENCE_NOT_FOUND' });
    }

    const contributor = await this.contributors.findByReputationId(
      stored.reputationId,
      session.cityId,
    );

    return this.projection.project(
      storedOccurrenceToReadSource(stored),
      contributor?.pseudonym ?? null,
    );
  }
}
