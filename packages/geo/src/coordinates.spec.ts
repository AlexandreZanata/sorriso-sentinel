import { describe, expect, it } from 'vitest';
import { distanceMeters, isValidCoordinates } from './coordinates.js';

describe('distanceMeters', () => {
  it('should_return_zero_for_same_point', () => {
    const point = { latitude: -12.5423, longitude: -55.7214 };
    expect(distanceMeters(point, point)).toBe(0);
  });
});

describe('isValidCoordinates', () => {
  it('should_reject_invalid_latitude', () => {
    expect(isValidCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
  });
});
