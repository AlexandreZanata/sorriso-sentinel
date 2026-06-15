export const PROFILE_PHOTO_VISIBILITIES = ['public', 'private'] as const;

export type ProfilePhotoVisibility =
  (typeof PROFILE_PHOTO_VISIBILITIES)[number];

export class InvalidProfilePhotoVisibilityError extends Error {
  constructor(value: string) {
    super(`Invalid profile photo visibility: ${value}`);
    this.name = 'InvalidProfilePhotoVisibilityError';
  }
}

export function parseProfilePhotoVisibility(
  value: string,
): ProfilePhotoVisibility {
  if ((PROFILE_PHOTO_VISIBILITIES as readonly string[]).includes(value)) {
    return value as ProfilePhotoVisibility;
  }

  throw new InvalidProfilePhotoVisibilityError(value);
}

export const DEFAULT_PROFILE_PHOTO_VISIBILITY: ProfilePhotoVisibility =
  'private';
