import { describe, expect, it } from 'vitest';
import { distanceMeters } from '@sorriso-sentinel/geo';
import { Occurrence } from './occurrence.entity.js';

describe('Occurrence.create', () => {
  const baseProps = {
    id: '01932f1a-0000-7000-8000-000000000001',
    cityId: '01932f1a-0000-7000-8000-000000000002',
    category: 'pothole',
    occurrenceKind: 'problem' as const,
    status: 'unverified' as const,
    confidenceLevel: 0,
    problemLocation: { latitude: -12.5423, longitude: -55.7214 },
    storedMapLocation: { latitude: -12.5423, longitude: -55.7214 },
    privacyLevel: 'public' as const,
    description: null,
    contributorRef: { reputationId: 'Rep-8F29A' },
    authorDisplayPolicy: 'ghost' as const,
    isSensitive: false,
    version: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  it('should_create_occurrence_with_zero_confidence', () => {
    const occurrence = Occurrence.create(baseProps);
    expect(occurrence.status).toBe('unverified');
    expect(occurrence.confidenceLevel).toBe(0);
  });

  it('should_reject_confidence_above_100', () => {
    expect(() =>
      Occurrence.create({ ...baseProps, confidenceLevel: 101 }),
    ).toThrow('Confidence level must be between 0 and 100');
  });
});

describe('Occurrence.createNew', () => {
  const fixedDate = new Date('2026-06-15T12:00:00.000Z');
  const baseParams = {
    cityId: '01932f1a-0000-7000-8000-000000000002',
    category: 'pothole',
    problemLocation: { latitude: -12.5423, longitude: -55.7214 },
    contributorRef: { reputationId: 'Rep-8F29A' },
    identityMode: 'ghost' as const,
    idGenerator: () => '01932f1a-0000-7000-8000-000000000001',
    clock: () => fixedDate,
  };

  it('should_create_occurrence_with_status_unverified', () => {
    const { occurrence } = Occurrence.createNew(baseParams);
    expect(occurrence.status).toBe('unverified');
  });

  it('should_create_occurrence_with_confidence_zero', () => {
    const { occurrence } = Occurrence.createNew(baseParams);
    expect(occurrence.confidenceLevel).toBe(0);
  });

  it('should_create_occurrence_with_version_one', () => {
    const { occurrence } = Occurrence.createNew(baseParams);
    expect(occurrence.version).toBe(1);
  });

  it('should_emit_occurrence_created_event', () => {
    const { occurrence, event } = Occurrence.createNew(baseParams);

    expect(event.type).toBe('OccurrenceCreated');
    expect(event.payload.occurrenceId).toBe(occurrence.id);
    expect(event.payload.status).toBe('unverified');
    expect(event.payload.confidenceLevel).toBe(0);
    expect(event.payload.isSensitive).toBe(false);
    expect(event.payload.occurredAt).toEqual(fixedDate);
    expect(event.payload).not.toHaveProperty('contributorRef');
  });

  it('should_mark_crime_category_as_sensitive', () => {
    const { occurrence } = Occurrence.createNew({
      ...baseParams,
      category: 'crime',
    });

    expect(occurrence.isSensitive).toBe(true);
  });

  it('should_apply_forced_ghost_for_sensitive_category', () => {
    const { occurrence } = Occurrence.createNew({
      ...baseParams,
      category: 'crime',
      identityMode: 'public',
    });

    expect(occurrence.authorDisplayPolicy).toBe('forced_ghost');
  });

  it('should_require_contributor_ref', () => {
    expect(() =>
      Occurrence.createNew({
        ...baseParams,
        contributorRef: { reputationId: '' },
      }),
    ).toThrow('Contributor reference is required');
  });

  it('should_reject_description_with_doxxing', () => {
    expect(() =>
      Occurrence.createNew({
        ...baseParams,
        description: 'Call me at (65) 99999-8888',
      }),
    ).toThrow('Description contains disallowed personal data pattern');
  });

  it('should_apply_approximate_shift_on_create', () => {
    const { occurrence } = Occurrence.createNew({
      ...baseParams,
      privacyLevel: 'approximate',
      random: () => 0.5,
    });

    expect(occurrence.storedMapLocation).not.toEqual(occurrence.problemLocation);
    expect(
      distanceMeters(occurrence.problemLocation, occurrence.storedMapLocation),
    ).toBeGreaterThanOrEqual(90);
  });
});
