import type { OccurrenceStatus } from '@sorriso-sentinel/domain';
import type { AuthorDisplayPolicy } from '@sorriso-sentinel/domain';

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

export interface OccurrenceStorePort {
  save(occurrence: StoredOccurrence): Promise<void>;
  update(
    occurrence: StoredOccurrence,
    expectedVersion: number,
  ): Promise<void>;
  findById(id: string, cityId: string): Promise<StoredOccurrence | null>;
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
}

export const OCCURRENCE_STORE = Symbol('OCCURRENCE_STORE');
