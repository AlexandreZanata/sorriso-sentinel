import { describe, expect, it } from 'vitest';
import { Occurrence } from './occurrence.entity.js';

describe('Occurrence', () => {
  const baseProps = {
    id: '01932f1a-0000-7000-8000-000000000001',
    cityId: '01932f1a-0000-7000-8000-000000000002',
    category: 'pothole',
    status: 'unverified' as const,
    confidenceLevel: 0,
    problemLocation: { latitude: -12.5423, longitude: -55.7214 },
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
