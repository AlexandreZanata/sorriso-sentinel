const MEDIA_PROCESSING_STATUSES = [
  'pending',
  'processing',
  'ready',
  'failed',
  'quarantined',
] as const;

export type MediaProcessingStatus = (typeof MEDIA_PROCESSING_STATUSES)[number];

export function parseMediaProcessingStatus(value: string): MediaProcessingStatus {
  if (!MEDIA_PROCESSING_STATUSES.includes(value as MediaProcessingStatus)) {
    throw new Error(`Invalid media processing status: ${value}`);
  }

  return value as MediaProcessingStatus;
}
