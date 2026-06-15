import { describe, expect, it } from 'vitest';
import { loginSchema } from './auth.schema.js';

describe('loginSchema', () => {
  it('should_reject_password_shorter_than_12_characters', () => {
    const result = loginSchema.safeParse({
      cityId: '01932f1a-0000-7000-8000-000000000001',
      email: 'user@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('should_reject_extra_fields', () => {
    const result = loginSchema.safeParse({
      cityId: '01932f1a-0000-7000-8000-000000000001',
      email: 'user@example.com',
      password: 'valid-password-12',
      extra: true,
    });

    expect(result.success).toBe(false);
  });
});
