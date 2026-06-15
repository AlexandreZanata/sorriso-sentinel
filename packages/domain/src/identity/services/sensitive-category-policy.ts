import type { IdentityMode } from '../value-objects/identity-mode.vo.js';
import type { AuthorDisplayPolicy } from '../value-objects/author-display-policy.vo.js';
import {
  DEFAULT_SENSITIVE_CATEGORY_SET,
  isSensitiveCategory,
} from '../value-objects/sensitive-category.vo.js';

export class SensitiveCategoryPolicy {
  constructor(
    private readonly sensitiveCategories: ReadonlySet<string>,
  ) {}

  static default(): SensitiveCategoryPolicy {
    return new SensitiveCategoryPolicy(DEFAULT_SENSITIVE_CATEGORY_SET);
  }

  applyAuthorDisplay(
    category: string,
    identityMode: IdentityMode,
  ): AuthorDisplayPolicy {
    if (isSensitiveCategory(category, this.sensitiveCategories)) {
      return 'forced_ghost';
    }

    return identityMode;
  }
}

export function applyAuthorDisplayPolicy(
  category: string,
  identityMode: IdentityMode,
  policy: SensitiveCategoryPolicy = SensitiveCategoryPolicy.default(),
): AuthorDisplayPolicy {
  return policy.applyAuthorDisplay(category, identityMode);
}
