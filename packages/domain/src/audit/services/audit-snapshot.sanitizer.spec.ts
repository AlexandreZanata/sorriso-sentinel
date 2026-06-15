import { describe, expect, it } from 'vitest';
import { sanitizeAuditSnapshot } from './audit-snapshot.sanitizer.js';

describe('sanitizeAuditSnapshot', () => {
  it('should_strip_pii_fields_from_audit_snapshot', () => {
    const result = sanitizeAuditSnapshot({
      id: '01932f1a-0000-7000-8000-000000000099',
      category: 'crime',
      description: 'secret details',
      reputationId: 'rep-hidden',
      pseudonym: 'HiddenUser',
      status: 'unverified',
    });

    expect(result).toEqual({
      id: '01932f1a-0000-7000-8000-000000000099',
      category: 'crime',
      status: 'unverified',
    });
  });

  it('should_return_null_for_empty_snapshot', () => {
    expect(sanitizeAuditSnapshot(null)).toBeNull();
    expect(sanitizeAuditSnapshot(undefined)).toBeNull();
  });
});
