import { describe, expect, it } from 'vitest';
import {
  applyAuthorDisplayPolicy,
  SensitiveCategoryPolicy,
} from './sensitive-category-policy.js';

describe('SensitiveCategoryPolicy', () => {
  const policy = SensitiveCategoryPolicy.default();

  it('should_force_ghost_display_for_crime_category', () => {
    expect(policy.applyAuthorDisplay('crime', 'ghost')).toBe('forced_ghost');
    expect(policy.applyAuthorDisplay('crime', 'pseudonym')).toBe('forced_ghost');
  });

  it('should_force_ghost_display_when_public_mode_user_reports_sensitive', () => {
    expect(policy.applyAuthorDisplay('violence', 'public')).toBe('forced_ghost');
    expect(policy.applyAuthorDisplay('corruption', 'public')).toBe('forced_ghost');
    expect(policy.applyAuthorDisplay('trafficking', 'pseudonym')).toBe(
      'forced_ghost',
    );
  });

  it('should_allow_pseudonym_display_for_non_sensitive_pothole', () => {
    expect(policy.applyAuthorDisplay('pothole', 'pseudonym')).toBe('pseudonym');
    expect(policy.applyAuthorDisplay('flooding', 'ghost')).toBe('ghost');
    expect(policy.applyAuthorDisplay('fair', 'public')).toBe('public');
  });

  it('should_return_forced_ghost_policy_object_for_sensitive_category', () => {
    const result = applyAuthorDisplayPolicy('crime', 'public');

    expect(result).toBe('forced_ghost');
  });
});
