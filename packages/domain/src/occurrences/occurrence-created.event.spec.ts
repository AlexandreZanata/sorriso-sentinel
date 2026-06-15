import { describe, expect, it } from 'vitest';
import { Occurrence } from './occurrence.entity.js';

describe('OccurrenceCreatedEvent', () => {
  const fixedDate = new Date('2026-01-01T00:00:00.000Z');
  const baseParams = {
    cityId: '01932f1a-0000-7000-8000-000000000001',
    category: 'pothole',
    problemLocation: { latitude: -12.5423, longitude: -55.7214 },
    contributorRef: { reputationId: 'Rep-ABCDE' },
    identityMode: 'ghost' as const,
    idGenerator: () => '01932f1a-0000-7000-8000-000000000099',
    clock: () => fixedDate,
  };

  it('should_not_include_contributor_ref_in_event_payload', () => {
    const { event } = Occurrence.createNew(baseParams);

    expect(event.payload).not.toHaveProperty('contributorRef');
    expect(JSON.stringify(event.payload)).not.toContain('Rep-ABCDE');
  });

  it('should_include_is_sensitive_flag_in_event_payload', () => {
    const { event: sensitiveEvent } = Occurrence.createNew({
      ...baseParams,
      category: 'crime',
    });

    expect(sensitiveEvent.payload.isSensitive).toBe(true);

    const { event: normalEvent } = Occurrence.createNew(baseParams);

    expect(normalEvent.payload.isSensitive).toBe(false);
  });
});
