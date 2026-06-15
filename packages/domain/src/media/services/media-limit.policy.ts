import type { MediaUploadPolicy } from '../value-objects/media-upload-policy.vo.js';

export class MediaLimitReachedError extends Error {
  constructor(message = 'Media limit reached') {
    super(message);
    this.name = 'MediaLimitReachedError';
  }
}

export class MediaUploadRateLimitError extends Error {
  constructor() {
    super('Upload slot rate limit reached');
    this.name = 'MediaUploadRateLimitError';
  }
}

export class MediaLimitPolicy {
  canAttachMore(
    existingActiveCount: number,
    policy: MediaUploadPolicy,
  ): boolean {
    return existingActiveCount < policy.maxImagesPerOccurrence;
  }

  assertCanAttachMore(
    existingActiveCount: number,
    policy: MediaUploadPolicy,
  ): void {
    if (!this.canAttachMore(existingActiveCount, policy)) {
      throw new MediaLimitReachedError();
    }
  }

  canRequestSlot(
    sessionSlotCountLastHour: number,
    policy: MediaUploadPolicy,
  ): boolean {
    return sessionSlotCountLastHour < policy.maxUploadSlotsPerHour;
  }

  assertCanRequestSlot(
    sessionSlotCountLastHour: number,
    policy: MediaUploadPolicy,
  ): void {
    if (!this.canRequestSlot(sessionSlotCountLastHour, policy)) {
      throw new MediaUploadRateLimitError();
    }
  }
}
