import type { AuthorDisplayPolicy } from '@sorriso-sentinel/domain';

export interface StoredOccurrence {
  id: string;
  cityId: string;
  category: string;
  status: 'unverified';
  confidenceLevel: 0;
  latitude: number;
  longitude: number;
  privacyLevel: string;
  description?: string;
  reputationId: string;
  authorDisplayPolicy: AuthorDisplayPolicy;
  createdAt: Date;
}

export interface OccurrenceStorePort {
  save(occurrence: StoredOccurrence): Promise<void>;
  findById(id: string, cityId: string): Promise<StoredOccurrence | null>;
}

export class InMemoryOccurrenceStore implements OccurrenceStorePort {
  private readonly records = new Map<string, StoredOccurrence>();

  async save(occurrence: StoredOccurrence): Promise<void> {
    this.records.set(`${occurrence.cityId}:${occurrence.id}`, occurrence);
  }

  async findById(
    id: string,
    cityId: string,
  ): Promise<StoredOccurrence | null> {
    return this.records.get(`${cityId}:${id}`) ?? null;
  }
}

export const OCCURRENCE_STORE = Symbol('OCCURRENCE_STORE');
