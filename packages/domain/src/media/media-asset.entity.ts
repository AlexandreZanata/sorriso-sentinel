import type { ContributorRef } from '../identity/value-objects/contributor-ref.vo.js';
import { EvidenceAttachedEvent } from './events/evidence-attached.event.js';
import { UploadSlotIssuedEvent } from './events/upload-slot-issued.event.js';
import { MediaLimitPolicy } from './services/media-limit.policy.js';
import {
  InvalidMediaContentTypeError,
  parseMediaContentType,
  type MediaContentType,
} from './value-objects/media-content-type.vo.js';
import type { MediaProcessingStatus } from './value-objects/media-processing-status.vo.js';
import type { MediaUploadPolicy } from './value-objects/media-upload-policy.vo.js';
import {
  buildQuarantineStorageKey,
  buildSanitizedStorageKey,
  parseStorageKey,
  type StorageKey,
} from './value-objects/storage-key.vo.js';

export interface MediaAssetProps {
  id: string;
  occurrenceId: string;
  cityId: string;
  requestedByReputationId: string;
  contentType: MediaContentType;
  declaredContentLength: number;
  rawStorageKey: StorageKey;
  sanitizedStorageKey: StorageKey | null;
  processingStatus: MediaProcessingStatus;
  failureReason: string | null;
  width: number | null;
  height: number | null;
  slotExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface IssueUploadSlotParams {
  id: string;
  occurrenceId: string;
  cityId: string;
  requestedBy: ContributorRef;
  contentType: string;
  contentLength: number;
  existingActiveCount: number;
  sessionSlotCountLastHour: number;
  policy: MediaUploadPolicy;
  clock: () => Date;
  mediaLimitPolicy?: MediaLimitPolicy;
}

export interface IssueUploadSlotResult {
  asset: MediaAsset;
  event: UploadSlotIssuedEvent;
}

export class MediaAsset {
  private constructor(private readonly props: MediaAssetProps) {}

  static issueUploadSlot(params: IssueUploadSlotParams): IssueUploadSlotResult {
    const mediaLimitPolicy = params.mediaLimitPolicy ?? new MediaLimitPolicy();
    mediaLimitPolicy.assertCanAttachMore(
      params.existingActiveCount,
      params.policy,
    );
    mediaLimitPolicy.assertCanRequestSlot(
      params.sessionSlotCountLastHour,
      params.policy,
    );

    const contentType = parseMediaContentType(params.contentType);

    if (
      params.contentLength <= 0 ||
      params.contentLength > params.policy.maxFileSizeBytes
    ) {
      throw new Error('Invalid content length');
    }

    const now = params.clock();
    const slotExpiresAt = new Date(
      now.getTime() + params.policy.presignedUrlTtlSeconds * 1000,
    );
    const rawStorageKey = buildQuarantineStorageKey({
      cityId: params.cityId,
      occurrenceId: params.occurrenceId,
      mediaId: params.id,
    });

    const asset = new MediaAsset({
      id: params.id,
      occurrenceId: params.occurrenceId,
      cityId: params.cityId,
      requestedByReputationId: params.requestedBy.reputationId,
      contentType,
      declaredContentLength: params.contentLength,
      rawStorageKey,
      sanitizedStorageKey: null,
      processingStatus: 'pending',
      failureReason: null,
      width: null,
      height: null,
      slotExpiresAt,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    return {
      asset,
      event: new UploadSlotIssuedEvent(
        asset.id,
        asset.occurrenceId,
        asset.cityId,
        asset.slotExpiresAt,
      ),
    };
  }

  static restore(props: MediaAssetProps): MediaAsset {
    return new MediaAsset(props);
  }

  get id(): string {
    return this.props.id;
  }

  get occurrenceId(): string {
    return this.props.occurrenceId;
  }

  get cityId(): string {
    return this.props.cityId;
  }

  get requestedByReputationId(): string {
    return this.props.requestedByReputationId;
  }

  get contentType(): MediaContentType {
    return this.props.contentType;
  }

  get declaredContentLength(): number {
    return this.props.declaredContentLength;
  }

  get rawStorageKey(): StorageKey {
    return this.props.rawStorageKey;
  }

  get sanitizedStorageKey(): StorageKey | null {
    return this.props.sanitizedStorageKey;
  }

  get processingStatus(): MediaProcessingStatus {
    return this.props.processingStatus;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get width(): number | null {
    return this.props.width;
  }

  get height(): number | null {
    return this.props.height;
  }

  get slotExpiresAt(): Date {
    return this.props.slotExpiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get version(): number {
    return this.props.version;
  }

  toProps(): MediaAssetProps {
    return { ...this.props };
  }

  markProcessing(clock: () => Date = () => new Date()): MediaAsset {
    if (this.props.processingStatus !== 'pending') {
      throw new Error('Only pending assets can move to processing');
    }

    return new MediaAsset({
      ...this.props,
      processingStatus: 'processing',
      updatedAt: clock(),
      version: this.props.version + 1,
    });
  }

  markReady(
    sanitizedKey: string,
    width: number,
    height: number,
    clock: () => Date = () => new Date(),
  ): { asset: MediaAsset; event: EvidenceAttachedEvent } {
    if (this.props.processingStatus !== 'processing') {
      throw new Error('Only processing assets can be marked ready');
    }

    const asset = new MediaAsset({
      ...this.props,
      sanitizedStorageKey: parseStorageKey(sanitizedKey),
      processingStatus: 'ready',
      width,
      height,
      updatedAt: clock(),
      version: this.props.version + 1,
    });

    return {
      asset,
      event: new EvidenceAttachedEvent(
        asset.id,
        asset.occurrenceId,
        asset.cityId,
      ),
    };
  }

  markFailed(
    reason: string,
    clock: () => Date = () => new Date(),
  ): MediaAsset {
    return new MediaAsset({
      ...this.props,
      processingStatus: 'failed',
      failureReason: reason,
      updatedAt: clock(),
      version: this.props.version + 1,
    });
  }

  markQuarantined(
    reason: string,
    clock: () => Date = () => new Date(),
  ): MediaAsset {
    return new MediaAsset({
      ...this.props,
      processingStatus: 'quarantined',
      failureReason: reason,
      updatedAt: clock(),
      version: this.props.version + 1,
    });
  }

  canServePublicly(): boolean {
    return this.props.processingStatus === 'ready';
  }

  buildExpectedSanitizedKey(): StorageKey {
    return buildSanitizedStorageKey({
      cityId: this.props.cityId,
      occurrenceId: this.props.occurrenceId,
      mediaId: this.props.id,
    });
  }
}

export { InvalidMediaContentTypeError };
