import type { OccurrenceStatus } from '@sorriso-sentinel/domain';
import type { AuthorDisplayPolicy } from '@sorriso-sentinel/domain';
import { encodeOccurrenceCursor } from '@sorriso-sentinel/shared';

export interface StoredOccurrence {
  id: string;
  cityId: string;
  category: string;
  occurrenceKind: string;
  status: OccurrenceStatus;
  confidenceLevel: number;
  latitude: number;
  longitude: number;
  privacyLevel: string;
  description?: string;
  reputationId: string;
  authorDisplayPolicy: AuthorDisplayPolicy;
  isSensitive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class OccurrenceUpdateConflictError extends Error {
  constructor() {
    super('Occurrence update conflict');
    this.name = 'OccurrenceUpdateConflictError';
  }
}

export interface OccurrenceListFilter {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  limit: number;
  cursor?: {
    createdAt: Date;
    id: string;
  };
  status?: string;
  category?: string;
}

export interface OccurrenceListResult {
  items: StoredOccurrence[];
  nextCursor?: string;
}

export interface OccurrenceStorePort {
  save(occurrence: StoredOccurrence): Promise<void>;
  update(
    occurrence: StoredOccurrence,
    expectedVersion: number,
  ): Promise<void>;
  findById(id: string, cityId: string): Promise<StoredOccurrence | null>;
  listInBbox(cityId: string, filter: OccurrenceListFilter): Promise<OccurrenceListResult>;
}

export class InMemoryOccurrenceStore implements OccurrenceStorePort {
  private readonly records = new Map<string, StoredOccurrence>();

  async save(occurrence: StoredOccurrence): Promise<void> {
    this.records.set(`${occurrence.cityId}:${occurrence.id}`, occurrence);
  }

  async update(
    occurrence: StoredOccurrence,
    expectedVersion: number,
  ): Promise<void> {
    const key = `${occurrence.cityId}:${occurrence.id}`;
    const existing = this.records.get(key);

    if (!existing || existing.version !== expectedVersion) {
      throw new OccurrenceUpdateConflictError();
    }

    this.records.set(key, occurrence);
  }

  async findById(
    id: string,
    cityId: string,
  ): Promise<StoredOccurrence | null> {
    return this.records.get(`${cityId}:${id}`) ?? null;
  }

  async listInBbox(
    cityId: string,
    filter: OccurrenceListFilter,
  ): Promise<OccurrenceListResult> {
    const matches = [...this.records.values()]
      .filter((occurrence) => occurrence.cityId === cityId)
      .filter((occurrence) => occurrence.privacyLevel !== 'hidden')
      .filter(
        (occurrence) =>
          occurrence.latitude >= filter.minLatitude &&
          occurrence.latitude <= filter.maxLatitude &&
          occurrence.longitude >= filter.minLongitude &&
          occurrence.longitude <= filter.maxLongitude,
      )
      .filter((occurrence) => !filter.status || occurrence.status === filter.status)
      .filter(
        (occurrence) => !filter.category || occurrence.category === filter.category,
      )
      .filter((occurrence) => {
        if (!filter.cursor) {
          return true;
        }

        if (occurrence.createdAt < filter.cursor.createdAt) {
          return true;
        }

        return (
          occurrence.createdAt.getTime() === filter.cursor.createdAt.getTime() &&
          occurrence.id < filter.cursor.id
        );
      })
      .sort((left, right) => {
        const createdDiff = right.createdAt.getTime() - left.createdAt.getTime();
        if (createdDiff !== 0) {
          return createdDiff;
        }

        return right.id.localeCompare(left.id);
      });

    const page = matches.slice(0, filter.limit + 1);
    const items = page.slice(0, filter.limit);
    const last = items.at(-1);
    const nextCursor =
      page.length > filter.limit && last
        ? encodeOccurrenceCursor(last.createdAt, last.id)
        : undefined;

    return { items, nextCursor };
  }
}

export const OCCURRENCE_STORE = Symbol('OCCURRENCE_STORE');
