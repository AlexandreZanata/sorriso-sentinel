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
  MEDIA_ASSET_REPOSITORY,
  MEDIA_JOB_QUEUE,
  UploadSlotValidator,
  InvalidUploadKeyError,
  UnauthorizedMediaCompleterError,
  UploadSlotExpiredError,
  type MediaAssetRepositoryPort,
  type MediaJobQueuePort,
} from '@sorriso-sentinel/domain';
import { completeUploadSchema } from '@sorriso-sentinel/shared';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';

export interface CompleteUploadResponse {
  mediaId: string;
  status: 'processing' | 'ready';
}

@Injectable()
export class CompleteUploadHandler {
  private readonly validator = new UploadSlotValidator();

  constructor(
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssets: MediaAssetRepositoryPort,
    @Inject(MEDIA_JOB_QUEUE)
    private readonly jobQueue: MediaJobQueuePort,
  ) {}

  async execute(
    slotId: string,
    body: unknown,
    session: SessionClaims | undefined,
  ): Promise<CompleteUploadResponse> {
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const parsed = completeUploadSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const props = await this.mediaAssets.findById(slotId, session.cityId);

    if (!props) {
      throw new NotFoundException({ code: 'UPLOAD_SLOT_NOT_FOUND' });
    }

    const asset = MediaAsset.restore(props);

    try {
      this.validator.validateComplete(
        asset,
        { reputationId: session.reputationId },
        parsed.data.uploadedKey,
      );
    } catch (error) {
      if (error instanceof UnauthorizedMediaCompleterError) {
        throw new ForbiddenException({ code: 'FORBIDDEN_COMPLETER' });
      }

      if (error instanceof InvalidUploadKeyError) {
        throw new ForbiddenException({ code: 'INVALID_UPLOAD_KEY' });
      }

      if (error instanceof UploadSlotExpiredError) {
        throw new ForbiddenException({ code: 'UPLOAD_SLOT_EXPIRED' });
      }

      throw error;
    }

    const processing = asset.markProcessing();
    await this.mediaAssets.save(processing.toProps());
    await this.jobQueue.enqueueAnonymize(processing.id, session.cityId);

    const refreshed = await this.mediaAssets.findById(slotId, session.cityId);
    const status = refreshed?.processingStatus === 'ready' ? 'ready' : 'processing';

    return {
      mediaId: slotId,
      status,
    };
  }
}
