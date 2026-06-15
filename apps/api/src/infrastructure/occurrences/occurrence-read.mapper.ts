import type { StoredOccurrence } from './in-memory-occurrence.store.js';
import type { OccurrenceReadSource } from '@sorriso-sentinel/domain';
import type { PrivacyLevel } from '@sorriso-sentinel/domain';

export function storedOccurrenceToReadSource(
  stored: StoredOccurrence,
): OccurrenceReadSource {
  return {
    id: stored.id,
    cityId: stored.cityId,
    category: stored.category,
    occurrenceKind: stored.occurrenceKind,
    status: stored.status,
    confidenceLevel: stored.confidenceLevel,
    privacyLevel: stored.privacyLevel as PrivacyLevel,
    latitude: stored.latitude,
    longitude: stored.longitude,
    description: stored.description,
    authorDisplayPolicy: stored.authorDisplayPolicy,
    isSensitive: stored.isSensitive,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}
