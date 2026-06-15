import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  MEDIA_ASSET_REPOSITORY,
  OBJECT_STORAGE,
  type MediaAssetRepositoryPort,
  type ObjectStoragePort,
} from '@sorriso-sentinel/domain';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import {
  OCCURRENCE_STORE,
  type OccurrenceStorePort,
} from '../../../infrastructure/occurrences/in-memory-occurrence.store';

export interface OccurrenceMediaItemDto {
  id: string;
  url: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface ListOccurrenceMediaResponse {
  items: OccurrenceMediaItemDto[];
}

@Injectable()
export class ListOccurrenceMediaHandler {
  constructor(
    @Inject(OCCURRENCE_STORE)
    private readonly occurrences: OccurrenceStorePort,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssets: MediaAssetRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly storage: ObjectStoragePort,
  ) {}

  async execute(
    occurrenceId: string,
    session: SessionClaims | undefined,
  ): Promise<ListOccurrenceMediaResponse> {
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    const occurrence = await this.occurrences.findById(
      occurrenceId,
      session.cityId,
    );

    if (!occurrence) {
      throw new NotFoundException({ code: 'OCCURRENCE_NOT_FOUND' });
    }

    const readyAssets = await this.mediaAssets.listReadyByOccurrence(
      occurrenceId,
      session.cityId,
    );

    const items = await Promise.all(
      readyAssets.map(async (asset) => {
        if (!asset.sanitizedStorageKey) {
          throw new Error('Ready asset missing sanitized key');
        }

        const signed = await this.storage.presignedGet(
          asset.sanitizedStorageKey,
          15 * 60,
        );

        return {
          id: asset.id,
          url: signed.downloadUrl,
          width: asset.width ?? 0,
          height: asset.height ?? 0,
          createdAt: asset.createdAt.toISOString(),
        };
      }),
    );

    return { items };
  }
}
