export interface MediaUploadPolicy {
  maxImagesPerOccurrence: number;
  maxFileSizeBytes: number;
  maxUploadSlotsPerHour: number;
  presignedUrlTtlSeconds: number;
  maxDecodedWidth: number;
  maxDecodedHeight: number;
  minDecodedWidth: number;
  minDecodedHeight: number;
}

export const DEFAULT_MEDIA_UPLOAD_POLICY: MediaUploadPolicy = {
  maxImagesPerOccurrence: 5,
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxUploadSlotsPerHour: 20,
  presignedUrlTtlSeconds: 15 * 60,
  maxDecodedWidth: 8192,
  maxDecodedHeight: 8192,
  minDecodedWidth: 100,
  minDecodedHeight: 100,
};
