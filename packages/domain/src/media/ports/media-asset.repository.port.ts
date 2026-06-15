import type { MediaAssetProps } from '../media-asset.entity.js';

export interface MediaAssetRepositoryPort {
  save(asset: MediaAssetProps): Promise<void>;
  findById(id: string, cityId: string): Promise<MediaAssetProps | null>;
  countActiveByOccurrence(occurrenceId: string, cityId: string): Promise<number>;
  countSlotsRequestedInLastHour(reputationId: string, cityId: string): Promise<number>;
  listReadyByOccurrence(occurrenceId: string, cityId: string): Promise<MediaAssetProps[]>;
}

export const MEDIA_ASSET_REPOSITORY = Symbol('MEDIA_ASSET_REPOSITORY');
