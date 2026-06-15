import { describe, expect, it } from 'vitest';
import { createOccurrenceSchema } from './create-occurrence.schema.js';

describe('createOccurrenceSchema', () => {
  const basePayload = {
    category: 'pothole',
    latitude: -12.5423,
    longitude: -55.7214,
  };

  it('should_accept_minimal_valid_create_payload', () => {
    const result = createOccurrenceSchema.safeParse(basePayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.privacyLevel).toBe('public');
    }
  });

  it('should_reject_contributor_latitude_in_create_payload', () => {
    const result = createOccurrenceSchema.safeParse({
      ...basePayload,
      contributorLatitude: -12.5423,
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_contributor_longitude_in_create_payload', () => {
    const result = createOccurrenceSchema.safeParse({
      ...basePayload,
      contributorLongitude: -55.7214,
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_status_field_in_create_payload', () => {
    const result = createOccurrenceSchema.safeParse({
      ...basePayload,
      status: 'active',
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_confidence_level_in_create_payload', () => {
    const result = createOccurrenceSchema.safeParse({
      ...basePayload,
      confidenceLevel: 50,
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_unknown_extra_properties', () => {
    const result = createOccurrenceSchema.safeParse({
      ...basePayload,
      reputationId: 'Rep-12345',
    });
    expect(result.success).toBe(false);
  });

  it('should_default_privacy_level_to_public', () => {
    const result = createOccurrenceSchema.parse(basePayload);
    expect(result.privacyLevel).toBe('public');
  });

  it('should_reject_invalid_latitude', () => {
    const result = createOccurrenceSchema.safeParse({
      ...basePayload,
      latitude: 95,
    });
    expect(result.success).toBe(false);
  });
});
