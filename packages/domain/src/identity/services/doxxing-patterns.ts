export type DoxxingReason = 'cpf' | 'phone' | 'license_plate' | 'full_name';

export type DoxxingPatternRule = {
  reason: DoxxingReason;
  pattern: RegExp;
};

export const DEFAULT_DOXXING_PATTERN_RULES: readonly DoxxingPatternRule[] = [
  { reason: 'cpf', pattern: /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/ },
  { reason: 'cpf', pattern: /\b\d{11}\b/ },
  { reason: 'phone', pattern: /\(\d{2}\)\s?\d{4,5}-?\d{4}/ },
  { reason: 'phone', pattern: /\b\d{2}\s?\d{4,5}-?\d{4}\b/ },
  { reason: 'license_plate', pattern: /\b[A-Z]{3}-?\d{4}\b/i },
  { reason: 'license_plate', pattern: /\b[A-Z]{3}\d[A-Z]\d{2}\b/i },
];

const NAME_PART_PATTERN = /^[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ]+$/;

export function findDoxxingViolation(
  text: string,
  rules: readonly DoxxingPatternRule[] = DEFAULT_DOXXING_PATTERN_RULES,
): DoxxingReason | null {
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      return rule.reason;
    }
  }
  return null;
}

export function containsDoxxingPattern(
  text: string,
  rules: readonly DoxxingPatternRule[] = DEFAULT_DOXXING_PATTERN_RULES,
): boolean {
  return findDoxxingViolation(text, rules) !== null;
}

export function looksLikeFullName(value: string): boolean {
  const parts = value.trim().split(/\s+/);

  if (parts.length < 2 || parts.length > 3) {
    return false;
  }

  return parts.every((part) => NAME_PART_PATTERN.test(part));
}
