import { describe, expect, it } from 'vitest';
import { createOccurrenceSchema } from './create-occurrence.schema.js';

describe('createOccurrenceSchema', () => {
  it('should_accept_valid_input', () => {
    const result = createOccurrenceSchema.safeParse({
      cityId: '01932f1a-0000-7000-8000-000000000001',
      category: 'pothole',
      latitude: -12.5423,
      longitude: -55.7214,
      privacyLevel: 'public',
    });
    expect(result.success).toBe(true);
  });

  it('should_reject_invalid_latitude', () => {
    const result = createOccurrenceSchema.safeParse({
      cityId: '01932f1a-0000-7000-8000-000000000001',
      category: 'pothole',
      latitude: 95,
      longitude: -55.7214,
      privacyLevel: 'public',
    });
    expect(result.success).toBe(false);
  });
});
