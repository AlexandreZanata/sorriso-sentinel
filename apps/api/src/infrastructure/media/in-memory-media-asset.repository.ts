import { Injectable } from '@nestjs/common';
import type { MediaAssetProps } from '@sorriso-sentinel/domain';
import type { MediaAssetRepositoryPort } from '@sorriso-sentinel/domain';

@Injectable()
export class InMemoryMediaAssetRepository implements MediaAssetRepositoryPort {
  private readonly assets = new Map<string, MediaAssetProps>();

  async save(asset: MediaAssetProps): Promise<void> {
    this.assets.set(asset.id, { ...asset });
  }

  async findById(id: string, cityId: string): Promise<MediaAssetProps | null> {
    const asset = this.assets.get(id);
    if (!asset || asset.cityId !== cityId) {
      return null;
    }

    return { ...asset };
  }

  async countActiveByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<number> {
    return [...this.assets.values()].filter(
      (asset) =>
        asset.occurrenceId === occurrenceId &&
        asset.cityId === cityId &&
        ['pending', 'processing', 'ready'].includes(asset.processingStatus),
    ).length;
  }

  async countSlotsRequestedInLastHour(
    reputationId: string,
    cityId: string,
  ): Promise<number> {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    return [...this.assets.values()].filter(
      (asset) =>
        asset.requestedByReputationId === reputationId &&
        asset.cityId === cityId &&
        asset.createdAt.getTime() >= oneHourAgo,
    ).length;
  }

  async listReadyByOccurrence(
    occurrenceId: string,
    cityId: string,
  ): Promise<MediaAssetProps[]> {
    return [...this.assets.values()]
      .filter(
        (asset) =>
          asset.occurrenceId === occurrenceId &&
          asset.cityId === cityId &&
          asset.processingStatus === 'ready',
      )
      .map((asset) => ({ ...asset }));
  }
}
