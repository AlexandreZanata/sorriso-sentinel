import { describe, expect, it } from 'vitest';
import { OccurrenceReadProjection } from './occurrence-read-projection.service.js';

const baseSource = {
  id: '01932f1a-0000-7000-8000-000000000042',
  cityId: '01932f1a-0000-7000-8000-000000000001',
  category: 'pothole',
  occurrenceKind: 'problem',
  status: 'unverified',
  confidenceLevel: 0,
  privacyLevel: 'public' as const,
  latitude: -12.5423,
  longitude: -55.7214,
  description: 'Test pothole',
  authorDisplayPolicy: 'pseudonym' as const,
  isSensitive: false,
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  updatedAt: new Date('2026-01-01T12:00:00.000Z'),
};

describe('OccurrenceReadProjection', () => {
  const projection = new OccurrenceReadProjection();

  it('should_expose_coordinates_for_public_privacy', () => {
    const dto = projection.project(baseSource, 'RtUser1');

    expect(dto.location).toEqual({ latitude: -12.5423, longitude: -55.7214 });
    expect(dto.author).toEqual({ displayPolicy: 'pseudonym', pseudonym: 'RtUser1' });
  });

  it('should_hide_coordinates_for_hidden_privacy', () => {
    const dto = projection.project({ ...baseSource, privacyLevel: 'hidden' });

    expect(dto.location).toBeUndefined();
  });

  it('should_hide_coordinates_for_neighborhood_privacy', () => {
    const dto = projection.project({ ...baseSource, privacyLevel: 'neighborhood' });

    expect(dto.location).toBeUndefined();
  });

  it('should_strip_description_and_author_for_sensitive_occurrence', () => {
    const dto = projection.project({
      ...baseSource,
      isSensitive: true,
      category: 'crime',
      authorDisplayPolicy: 'forced_ghost',
    });

    expect(dto.description).toBeUndefined();
    expect(dto.author).toBeUndefined();
  });
});
