import type { ContributorRef } from '../../identity/value-objects/contributor-ref.vo.js';
import type { MediaAsset } from '../media-asset.entity.js';
import type { StorageKey } from '../value-objects/storage-key.vo.js';

export class InvalidUploadKeyError extends Error {
  constructor() {
    super('Uploaded storage key does not match slot');
    this.name = 'InvalidUploadKeyError';
  }
}

export class UnauthorizedMediaCompleterError extends Error {
  constructor() {
    super('Only the slot requester can complete the upload');
    this.name = 'UnauthorizedMediaCompleterError';
  }
}

export class UploadSlotExpiredError extends Error {
  constructor() {
    super('Upload slot has expired');
    this.name = 'UploadSlotExpiredError';
  }
}

export class UploadSlotValidator {
  validateComplete(
    asset: MediaAsset,
    completer: ContributorRef,
    uploadedKey: StorageKey,
    clock: () => Date = () => new Date(),
  ): void {
    if (asset.requestedByReputationId !== completer.reputationId) {
      throw new UnauthorizedMediaCompleterError();
    }

    if (asset.rawStorageKey !== uploadedKey) {
      throw new InvalidUploadKeyError();
    }

    if (asset.slotExpiresAt.getTime() <= clock().getTime()) {
      throw new UploadSlotExpiredError();
    }

    if (asset.processingStatus !== 'pending') {
      throw new Error('Upload slot is not pending');
    }
  }
}
