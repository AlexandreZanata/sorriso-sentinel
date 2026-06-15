import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ContentPolicyService,
  SensitiveCategoryPolicy,
  type AuthorDisplayPolicy,
} from '@sorriso-sentinel/domain';
import { createOccurrenceSchema } from '@sorriso-sentinel/shared';
import { randomUUID } from 'node:crypto';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
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
  private readonly sensitivePolicy = SensitiveCategoryPolicy.default();
  private readonly contentPolicy = ContentPolicyService.default();

  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
    @Inject(REDIS_RATE_LIMITER)
    private readonly rateLimiter: RateLimiterPort,
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

    if (parsed.data.description) {
      const descriptionCheck = this.contentPolicy.validateUserText(
        parsed.data.description,
      );

      if (!descriptionCheck.ok) {
        throw new BadRequestException({ code: 'DOXXING_DETECTED' });
      }
    }

    const authorDisplayPolicy = this.sensitivePolicy.applyAuthorDisplay(
      parsed.data.category,
      session.identityMode,
    );

    const occurrence: StoredOccurrence = {
      id: randomUUID(),
      cityId,
      category: parsed.data.category,
      status: 'unverified',
      confidenceLevel: 0,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      privacyLevel: parsed.data.privacyLevel,
      description: parsed.data.description,
      reputationId: session.reputationId,
      authorDisplayPolicy,
      createdAt: new Date(),
    };

    await this.occurrences.save(occurrence);

    return this.toResponse(occurrence, session);
  }

  private toResponse(
    occurrence: StoredOccurrence,
    session: SessionClaims,
  ): CreateOccurrenceResponse {
    const response: CreateOccurrenceResponse = {
      id: occurrence.id,
      cityId: occurrence.cityId,
      category: occurrence.category,
      status: occurrence.status,
      confidenceLevel: occurrence.confidenceLevel,
      latitude: occurrence.latitude,
      longitude: occurrence.longitude,
      privacyLevel: occurrence.privacyLevel,
      description: occurrence.description,
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
