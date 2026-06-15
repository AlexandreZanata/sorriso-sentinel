import { describe, expect, it } from 'vitest';
import { bootstrapSessionSchema } from './bootstrap-session.schema.js';

describe('bootstrapSessionSchema', () => {
  const validPayload = {
    cityId: '01932f1a-0000-7000-8000-000000000001',
    localKeyRef: 'fingerprint-abc12345',
  };

  it('should_accept_valid_bootstrap_payload', () => {
    const result = bootstrapSessionSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should_reject_bootstrap_payload_with_extra_fields', () => {
    const result = bootstrapSessionSchema.safeParse({
      ...validPayload,
      deviceModel: 'Pixel 8',
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_local_key_ref_shorter_than_8_characters', () => {
    const result = bootstrapSessionSchema.safeParse({
      ...validPayload,
      localKeyRef: 'short',
    });
    expect(result.success).toBe(false);
  });
});
