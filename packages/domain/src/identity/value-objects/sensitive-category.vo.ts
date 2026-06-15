export const DEFAULT_SENSITIVE_CATEGORIES = [
  'crime',
  'violence',
  'corruption',
  'trafficking',
] as const;

export type SensitiveCategory = (typeof DEFAULT_SENSITIVE_CATEGORIES)[number];

export const DEFAULT_SENSITIVE_CATEGORY_SET = new Set<string>(
  DEFAULT_SENSITIVE_CATEGORIES,
);

export function isSensitiveCategory(
  category: string,
  sensitiveCategories: ReadonlySet<string> = DEFAULT_SENSITIVE_CATEGORY_SET,
): boolean {
  return sensitiveCategories.has(category);
}
