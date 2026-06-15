import { describe, expect, it } from 'vitest';
import { parseEmailAddress } from './email-address.vo.js';

describe('EmailAddress', () => {
  it('should_normalize_email_to_lowercase', () => {
    expect(parseEmailAddress('User@Example.COM')).toBe('user@example.com');
  });

  it('should_reject_invalid_email_format', () => {
    expect(() => parseEmailAddress('not-an-email')).toThrow(/Invalid email address/);
    expect(() => parseEmailAddress('')).toThrow(/Invalid email address/);
  });
});
