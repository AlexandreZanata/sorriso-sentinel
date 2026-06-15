import {
  DEFAULT_DOXXING_PATTERN_RULES,
  findDoxxingViolation,
  looksLikeFullName,
  type DoxxingPatternRule,
  type DoxxingReason,
} from './doxxing-patterns.js';

export type SanitizedText = string;

export class DoxxingDetected {
  constructor(public readonly reason: DoxxingReason) {}
}

export type ContentPolicyResult =
  | { ok: true; value: SanitizedText }
  | { ok: false; error: DoxxingDetected };

export class ContentPolicyService {
  constructor(
    private readonly customPatterns: readonly DoxxingPatternRule[] = [],
  ) {}

  static default(): ContentPolicyService {
    return new ContentPolicyService();
  }

  scanForDoxxing(text: string): ContentPolicyResult {
    return this.validateUserText(text);
  }

  validateUserText(text: string): ContentPolicyResult {
    const trimmed = text.trim();
    const rules = [...DEFAULT_DOXXING_PATTERN_RULES, ...this.customPatterns];
    const violation = findDoxxingViolation(trimmed, rules);

    if (violation) {
      return { ok: false, error: new DoxxingDetected(violation) };
    }

    return { ok: true, value: trimmed };
  }

  validatePseudonym(text: string): ContentPolicyResult {
    const base = this.validateUserText(text);

    if (!base.ok) {
      return base;
    }

    if (looksLikeFullName(base.value)) {
      return { ok: false, error: new DoxxingDetected('full_name') };
    }

    return base;
  }
}
