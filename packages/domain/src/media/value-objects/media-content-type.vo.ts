const ALLOWED_MEDIA_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type MediaContentType = (typeof ALLOWED_MEDIA_CONTENT_TYPES)[number];

export class InvalidMediaContentTypeError extends Error {
  constructor() {
    super('Invalid media content type');
    this.name = 'InvalidMediaContentTypeError';
  }
}

export function parseMediaContentType(value: string): MediaContentType {
  if (
    !ALLOWED_MEDIA_CONTENT_TYPES.includes(value as MediaContentType)
  ) {
    throw new InvalidMediaContentTypeError();
  }

  return value as MediaContentType;
}

export function isAllowedMediaContentType(value: string): value is MediaContentType {
  return ALLOWED_MEDIA_CONTENT_TYPES.includes(value as MediaContentType);
}
