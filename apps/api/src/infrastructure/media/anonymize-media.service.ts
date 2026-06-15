import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  MediaAsset,
  MEDIA_ASSET_REPOSITORY,
  OBJECT_STORAGE,
  type MediaAssetRepositoryPort,
  type ObjectStoragePort,
} from '@sorriso-sentinel/domain';
import {
  ImageSanitizerService,
  InvalidImageError,
} from './image-sanitizer.service';

@Injectable()
export class AnonymizeMediaService {
  private readonly logger = new Logger(AnonymizeMediaService.name);

  constructor(
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssets: MediaAssetRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly storage: ObjectStoragePort,
    private readonly imageSanitizer: ImageSanitizerService,
  ) {}

  async process(mediaId: string, cityId: string): Promise<void> {
    const props = await this.mediaAssets.findById(mediaId, cityId);

    if (!props) {
      this.logger.warn(`Media asset not found: ${mediaId}`);
      return;
    }

    let asset = MediaAsset.restore(props);

    if (asset.processingStatus === 'ready') {
      return;
    }

    if (asset.processingStatus !== 'processing') {
      this.logger.warn(`Media asset ${mediaId} is not processing`);
      return;
    }

    try {
      const rawBuffer = await this.storage.getObject(asset.rawStorageKey);
      const sanitized = await this.imageSanitizer.sanitize(rawBuffer);
      const sanitizedKey = asset.buildExpectedSanitizedKey();

      await this.storage.putObject(
        sanitizedKey,
        sanitized.buffer,
        sanitized.outputContentType,
      );

      const { asset: readyAsset } = asset.markReady(
        sanitizedKey,
        sanitized.width,
        sanitized.height,
      );

      await this.mediaAssets.save(readyAsset.toProps());

      try {
        await this.storage.deleteObject(asset.rawStorageKey);
      } catch {
        this.logger.warn(`Failed to delete raw object for ${mediaId}`);
      }
    } catch (error) {
      const reason =
        error instanceof InvalidImageError
          ? error.message
          : 'Media processing failed';

      const quarantined = asset.markQuarantined(reason);
      await this.mediaAssets.save(quarantined.toProps());
    }
  }
}
