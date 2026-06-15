import { describe, expect, it } from 'vitest';
import {
  decodeOccurrenceCursor,
  encodeOccurrenceCursor,
  listOccurrencesQuerySchema,
  MAX_BBOX_SPAN_DEGREES,
  MAX_LIST_LIMIT,
} from './list-occurrences.schema.js';

describe('listOccurrencesQuerySchema', () => {
  const validBbox = {
    minLatitude: -12.55,
    maxLatitude: -12.53,
    minLongitude: -55.73,
    maxLongitude: -55.71,
  };

  it('should_accept_valid_bbox_query', () => {
    const result = listOccurrencesQuerySchema.safeParse(validBbox);
    expect(result.success).toBe(true);
  });

  it('should_reject_inverted_latitude_bounds', () => {
    const result = listOccurrencesQuerySchema.safeParse({
      ...validBbox,
      minLatitude: -12.53,
      maxLatitude: -12.55,
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_bbox_span_exceeding_max_degrees', () => {
    const result = listOccurrencesQuerySchema.safeParse({
      minLatitude: -12.55,
      maxLatitude: -12.55 + MAX_BBOX_SPAN_DEGREES + 0.01,
      minLongitude: -55.73,
      maxLongitude: -55.71,
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_limit_above_max', () => {
    const result = listOccurrencesQuerySchema.safeParse({
      ...validBbox,
      limit: MAX_LIST_LIMIT + 1,
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_unknown_query_fields', () => {
    const result = listOccurrencesQuerySchema.safeParse({
      ...validBbox,
      cityId: '01932f1a-0000-7000-8000-000000000001',
    });
    expect(result.success).toBe(false);
  });
});

describe('occurrence cursor codec', () => {
  it('should_round_trip_cursor', () => {
    const createdAt = new Date('2026-06-15T12:00:00.000Z');
    const id = '01932f1a-0000-7000-8000-000000000099';
    const cursor = encodeOccurrenceCursor(createdAt, id);

    expect(decodeOccurrenceCursor(cursor)).toEqual({ createdAt, id });
  });

  it('should_reject_invalid_cursor', () => {
    expect(() => decodeOccurrenceCursor('not-a-valid-cursor')).toThrow('Invalid cursor');
  });
});
