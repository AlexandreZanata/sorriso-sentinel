import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CONTRIBUTOR_IDENTITY_REPOSITORY,
  OccurrenceReadProjection,
  type ContributorIdentityRepositoryPort,
  type OccurrenceReadDto,
} from '@sorriso-sentinel/domain';
import {
  DEFAULT_LIST_LIMIT,
  decodeOccurrenceCursor,
  listOccurrencesQuerySchema,
} from '@sorriso-sentinel/shared';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { storedOccurrenceToReadSource } from '../../../infrastructure/occurrences/occurrence-read.mapper';
import {
  OCCURRENCE_STORE,
  type OccurrenceStorePort,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';

export interface ListOccurrencesResponse {
  items: OccurrenceReadDto[];
  nextCursor?: string;
}

@Injectable()
export class ListOccurrencesHandler {
  private readonly projection = new OccurrenceReadProjection();

  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
    @Inject(CONTRIBUTOR_IDENTITY_REPOSITORY)
    private readonly contributors: ContributorIdentityRepositoryPort,
  ) {}

  async execute(
    query: unknown,
    session: SessionClaims | undefined,
  ): Promise<ListOccurrencesResponse> {
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const parsed = listOccurrencesQuerySchema.safeParse(query);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    let cursor: { createdAt: Date; id: string } | undefined;

    if (parsed.data.cursor) {
      try {
        cursor = decodeOccurrenceCursor(parsed.data.cursor);
      } catch {
        throw new BadRequestException({ code: 'INVALID_CURSOR' });
      }
    }

    const result = await this.occurrences.listInBbox(session.cityId, {
      minLatitude: parsed.data.minLatitude,
      maxLatitude: parsed.data.maxLatitude,
      minLongitude: parsed.data.minLongitude,
      maxLongitude: parsed.data.maxLongitude,
      limit: parsed.data.limit ?? DEFAULT_LIST_LIMIT,
      cursor,
      status: parsed.data.status,
      category: parsed.data.category,
    });

    const items = await Promise.all(
      result.items.map(async (stored) => {
        const contributor = await this.contributors.findByReputationId(
          stored.reputationId,
          session.cityId,
        );

        return this.projection.project(
          storedOccurrenceToReadSource(stored),
          contributor?.pseudonym ?? null,
        );
      }),
    );

    return {
      items,
      nextCursor: result.nextCursor,
    };
  }
}
