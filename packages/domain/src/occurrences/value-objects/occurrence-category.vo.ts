export const DEFAULT_ALLOWED_CATEGORIES = [
  'pothole',
  'flooding',
  'broken_light',
  'accident',
  'construction',
  'fair',
  'road_closure',
  'wildfire',
  'rural_road_damage',
  'loose_animal',
  'crime',
  'violence',
  'corruption',
  'trafficking',
] as const;

export type AllowedOccurrenceCategory = (typeof DEFAULT_ALLOWED_CATEGORIES)[number];

export const DEFAULT_ALLOWED_CATEGORY_SET = new Set<string>(DEFAULT_ALLOWED_CATEGORIES);

export class InvalidOccurrenceCategoryError extends Error {
  constructor(value: string) {
    super(`Invalid occurrence category: ${value}`);
    this.name = 'InvalidOccurrenceCategoryError';
  }
}

export function parseOccurrenceCategory(
  value: string,
  allowedCategories: ReadonlySet<string> = DEFAULT_ALLOWED_CATEGORY_SET,
): string {
  const normalized = value.trim().toLowerCase();

  if (!normalized || !allowedCategories.has(normalized)) {
    throw new InvalidOccurrenceCategoryError(value);
  }

  return normalized;
}
