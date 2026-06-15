import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  InvalidOccurrenceCategoryError,
  Occurrence,
  type AuthorDisplayPolicy,
} from '@sorriso-sentinel/domain';
import { createOccurrenceSchema } from '@sorriso-sentinel/shared';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import {
  OCCURRENCE_ID_GENERATOR,
  type OccurrenceIdGeneratorPort,
} from '../../../infrastructure/database/occurrence-id-generator.port';
import {
  OCCURRENCE_EVENT_PUBLISHER,
  type OccurrenceEventPublisherPort,
} from '../../../infrastructure/occurrences/occurrence-event.publisher';
import type { RateLimiterPort } from '../../../infrastructure/redis/rate-limiter.port';
import { REDIS_RATE_LIMITER } from '../../../infrastructure/redis/redis.tokens';
import {
  OCCURRENCE_STORE,
  type OccurrenceStorePort,
  type StoredOccurrence,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';

export interface OccurrenceAuthorDto {
  displayPolicy: AuthorDisplayPolicy;
  pseudonym: string | null;
}

export interface CreateOccurrenceResponse {
  id: string;
  cityId: string;
  category: string;
  status: 'unverified';
  confidenceLevel: 0;
  latitude: number;
  longitude: number;
  privacyLevel: string;
  description?: string;
  author?: OccurrenceAuthorDto;
}

@Injectable()
export class CreateOccurrenceHandler {
  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
    @Inject(REDIS_RATE_LIMITER)
    private readonly rateLimiter: RateLimiterPort,
    @Inject(OCCURRENCE_EVENT_PUBLISHER)
    private readonly eventPublisher: OccurrenceEventPublisherPort,
    @Inject(OCCURRENCE_ID_GENERATOR)
    private readonly occurrenceIds: OccurrenceIdGeneratorPort,
  ) {}

  async execute(
    body: unknown,
    session: SessionClaims | undefined,
  ): Promise<CreateOccurrenceResponse> {
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const parsed = createOccurrenceSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const cityId = parsed.data.cityId ?? session.cityId;

    if (cityId !== session.cityId) {
      throw new ForbiddenException({ code: 'CITY_MISMATCH' });
    }

    const rateLimit = await this.rateLimiter.consume(
      `occurrence:${session.reputationId}`,
      10,
      3600,
    );

    if (!rateLimit.allowed) {
      throw new HttpException({ code: 'RATE_LIMIT_EXCEEDED' }, 429);
    }

    let occurrence: Occurrence;
    let event: Awaited<
      ReturnType<typeof Occurrence.createNew>
    >['event'];

    try {
      const id = await this.occurrenceIds.generate();
      const result = Occurrence.createNew({
        cityId,
        category: parsed.data.category,
        occurrenceKind: parsed.data.occurrenceKind,
        problemLocation: {
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
        },
        privacyLevel: parsed.data.privacyLevel,
        description: parsed.data.description,
        contributorRef: { reputationId: session.reputationId },
        identityMode: session.identityMode,
        idGenerator: () => id,
        clock: () => new Date(),
      });

      occurrence = result.occurrence;
      event = result.event;
    } catch (error) {
      this.rethrowDomainError(error);
    }

    await this.occurrences.save(this.toStoredOccurrence(occurrence));
    await this.eventPublisher.publish(event);

    return this.toResponse(occurrence, session);
  }

  private rethrowDomainError(error: unknown): never {
    if (error instanceof InvalidOccurrenceCategoryError) {
      throw new BadRequestException({ code: 'INVALID_CATEGORY' });
    }

    if (
      error instanceof Error &&
      error.message === 'Description contains disallowed personal data pattern'
    ) {
      throw new BadRequestException({ code: 'DOXXING_DETECTED' });
    }

    throw error;
  }

  private toStoredOccurrence(occurrence: Occurrence): StoredOccurrence {
    return {
      id: occurrence.id,
      cityId: occurrence.cityId,
      category: occurrence.category,
      occurrenceKind: occurrence.occurrenceKind,
      status: 'unverified',
      confidenceLevel: occurrence.confidenceLevel as 0,
      latitude: occurrence.storedMapLocation.latitude,
      longitude: occurrence.storedMapLocation.longitude,
      privacyLevel: occurrence.privacyLevel,
      description: occurrence.description ?? undefined,
      reputationId: occurrence.contributorRef.reputationId,
      authorDisplayPolicy: occurrence.authorDisplayPolicy,
      isSensitive: occurrence.isSensitive,
      version: occurrence.version,
      createdAt: occurrence.createdAt,
    };
  }

  private toResponse(
    occurrence: Occurrence,
    session: SessionClaims,
  ): CreateOccurrenceResponse {
    const response: CreateOccurrenceResponse = {
      id: occurrence.id,
      cityId: occurrence.cityId,
      category: occurrence.category,
      status: 'unverified',
      confidenceLevel: occurrence.confidenceLevel as 0,
      latitude: occurrence.storedMapLocation.latitude,
      longitude: occurrence.storedMapLocation.longitude,
      privacyLevel: occurrence.privacyLevel,
      description: occurrence.description ?? undefined,
    };

    if (
      occurrence.authorDisplayPolicy === 'pseudonym' ||
      occurrence.authorDisplayPolicy === 'public'
    ) {
      response.author = {
        displayPolicy: occurrence.authorDisplayPolicy,
        pseudonym: session.pseudonym,
      };
    }

    return response;
  }
}
