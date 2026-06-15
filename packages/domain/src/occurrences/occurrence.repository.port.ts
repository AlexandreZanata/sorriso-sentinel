import type { Occurrence } from './occurrence.entity.js';

export interface OccurrenceRepositoryPort {
  save(occurrence: Occurrence): Promise<void>;
  findById(id: string, cityId: string): Promise<Occurrence | null>;
}
