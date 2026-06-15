import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  MediaAsset,
  MediaLimitReachedError,
  MediaUploadRateLimitError,
  OBJECT_STORAGE,
  MEDIA_ASSET_REPOSITORY,
  type MediaAssetRepositoryPort,
  type ObjectStoragePort,
  InvalidMediaContentTypeError,
} from '@sorriso-sentinel/domain';
import {
  createRequestUploadSlotSchema,
  loadMediaUploadPolicyFromEnv,
} from '@sorriso-sentinel/shared';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import {
  OCCURRENCE_STORE,
  type OccurrenceStorePort,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';
import {
  MEDIA_ID_GENERATOR,
  type MediaIdGeneratorPort,
} from '../../../infrastructure/media/media-id-generator.port';

export interface RequestUploadSlotResponse {
  slotId: string;
  uploadUrl: string;
  expiresAt: string;
}

@Injectable()
export class RequestUploadSlotHandler {
  private readonly policy = loadMediaUploadPolicyFromEnv();

  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssets: MediaAssetRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly storage: ObjectStoragePort,
    @Inject(MEDIA_ID_GENERATOR)
    private readonly mediaIds: MediaIdGeneratorPort,
  ) {}

  async execute(
    occurrenceId: string,
    body: unknown,
    session: SessionClaims | undefined,
  ): Promise<RequestUploadSlotResponse> {
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const schema = createRequestUploadSlotSchema(this.policy.maxFileSizeBytes);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const occurrence = await this.occurrences.findById(
      occurrenceId,
      session.cityId,
    );

    if (!occurrence) {
      throw new NotFoundException({ code: 'OCCURRENCE_NOT_FOUND' });
    }

    if (occurrence.reputationId !== session.reputationId) {
      throw new ForbiddenException({ code: 'FORBIDDEN_OCCURRENCE' });
    }

    try {
      const [existingActiveCount, sessionSlotCountLastHour] = await Promise.all([
        this.mediaAssets.countActiveByOccurrence(occurrenceId, session.cityId),
        this.mediaAssets.countSlotsRequestedInLastHour(
          session.reputationId,
          session.cityId,
        ),
      ]);

      const mediaId = await this.mediaIds.generate();
      const { asset } = MediaAsset.issueUploadSlot({
        id: mediaId,
        occurrenceId,
        cityId: session.cityId,
        requestedBy: { reputationId: session.reputationId },
        contentType: parsed.data.contentType,
        contentLength: parsed.data.contentLength,
        existingActiveCount,
        sessionSlotCountLastHour,
        policy: this.policy,
        clock: () => new Date(),
      });

      const presigned = await this.storage.presignedPut(
        asset.rawStorageKey,
        asset.contentType,
        asset.declaredContentLength,
        this.policy.presignedUrlTtlSeconds,
      );

      await this.mediaAssets.save(asset.toProps());

      return {
        slotId: asset.id,
        uploadUrl: presigned.uploadUrl,
        expiresAt: presigned.expiresAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof MediaLimitReachedError) {
        throw new ForbiddenException({ code: 'MEDIA_LIMIT_REACHED' });
      }

      if (error instanceof MediaUploadRateLimitError) {
        throw new ForbiddenException({ code: 'UPLOAD_SLOT_RATE_LIMIT' });
      }

      if (error instanceof InvalidMediaContentTypeError) {
        throw new BadRequestException({ code: 'INVALID_CONTENT_TYPE' });
      }

      throw error;
    }
  }
}
