import {
  Occurrence,
  type AuthorDisplayPolicy,
  type OccurrenceKind,
  type PrivacyLevel,
} from '@sorriso-sentinel/domain';
import type { StoredOccurrence } from './in-memory-occurrence.store';

export function storedOccurrenceToDomain(stored: StoredOccurrence): Occurrence {
  const location = {
    latitude: stored.latitude,
    longitude: stored.longitude,
  };

  return Occurrence.rehydrate({
    id: stored.id,
    cityId: stored.cityId,
    category: stored.category,
    occurrenceKind: stored.occurrenceKind as OccurrenceKind,
    status: stored.status,
    confidenceLevel: stored.confidenceLevel,
    problemLocation: location,
    storedMapLocation: location,
    privacyLevel: stored.privacyLevel as PrivacyLevel,
    description: stored.description ?? null,
    contributorRef: { reputationId: stored.reputationId },
    authorDisplayPolicy: stored.authorDisplayPolicy as AuthorDisplayPolicy,
    isSensitive: stored.isSensitive,
    version: stored.version,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  });
}

export function domainOccurrenceToStored(occurrence: Occurrence): StoredOccurrence {
  return {
    id: occurrence.id,
    cityId: occurrence.cityId,
    category: occurrence.category,
    occurrenceKind: occurrence.occurrenceKind,
    status: occurrence.status,
    confidenceLevel: occurrence.confidenceLevel,
    latitude: occurrence.storedMapLocation.latitude,
    longitude: occurrence.storedMapLocation.longitude,
    privacyLevel: occurrence.privacyLevel,
    description: occurrence.description ?? undefined,
    reputationId: occurrence.contributorRef.reputationId,
    authorDisplayPolicy: occurrence.authorDisplayPolicy,
    isSensitive: occurrence.isSensitive,
    version: occurrence.version,
    createdAt: occurrence.createdAt,
    updatedAt: occurrence.updatedAt,
  };
}
