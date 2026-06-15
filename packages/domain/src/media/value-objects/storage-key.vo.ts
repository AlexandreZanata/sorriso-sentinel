export class InvalidStorageKeyError extends Error {
  constructor(message = 'Invalid storage key') {
    super(message);
    this.name = 'InvalidStorageKeyError';
  }
}

export type StorageKey = string;

export function parseStorageKey(value: string): StorageKey {
  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 512) {
    throw new InvalidStorageKeyError();
  }

  if (trimmed.includes('..') || trimmed.startsWith('/')) {
    throw new InvalidStorageKeyError();
  }

  return trimmed;
}

export function buildQuarantineStorageKey(params: {
  cityId: string;
  occurrenceId: string;
  mediaId: string;
}): StorageKey {
  return `quarantine/${params.cityId}/${params.occurrenceId}/${params.mediaId}`;
}

export function buildSanitizedStorageKey(params: {
  cityId: string;
  occurrenceId: string;
  mediaId: string;
}): StorageKey {
  return `sanitized/${params.cityId}/${params.occurrenceId}/${params.mediaId}.jpg`;
}
