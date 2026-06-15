import {
  BadRequestException,
  ForbiddenException,
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
