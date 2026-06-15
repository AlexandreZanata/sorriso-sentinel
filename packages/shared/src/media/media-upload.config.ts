import {
  DEFAULT_MEDIA_UPLOAD_POLICY,
  type MediaUploadPolicy,
} from '@sorriso-sentinel/domain';

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function loadMediaUploadPolicyFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): MediaUploadPolicy {
  const maxFileSizeMb = parsePositiveInt(
    env.MAX_MEDIA_FILE_SIZE_MB,
    DEFAULT_MEDIA_UPLOAD_POLICY.maxFileSizeBytes / (1024 * 1024),
  );

  return {
    maxImagesPerOccurrence: parsePositiveInt(
      env.MAX_IMAGES_PER_OCCURRENCE,
      DEFAULT_MEDIA_UPLOAD_POLICY.maxImagesPerOccurrence,
    ),
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
    maxUploadSlotsPerHour: parsePositiveInt(
      env.MAX_UPLOAD_SLOTS_PER_HOUR,
      DEFAULT_MEDIA_UPLOAD_POLICY.maxUploadSlotsPerHour,
    ),
    presignedUrlTtlSeconds: parsePositiveInt(
      env.PRESIGNED_URL_TTL_SECONDS,
      DEFAULT_MEDIA_UPLOAD_POLICY.presignedUrlTtlSeconds,
    ),
    maxDecodedWidth: DEFAULT_MEDIA_UPLOAD_POLICY.maxDecodedWidth,
    maxDecodedHeight: DEFAULT_MEDIA_UPLOAD_POLICY.maxDecodedHeight,
    minDecodedWidth: DEFAULT_MEDIA_UPLOAD_POLICY.minDecodedWidth,
    minDecodedHeight: DEFAULT_MEDIA_UPLOAD_POLICY.minDecodedHeight,
  };
}
