import { describe, expect, it } from 'vitest';
import { distanceMeters } from './coordinates.js';
import {
  APPROXIMATE_OFFSET_MAX_METERS,
  APPROXIMATE_OFFSET_MIN_METERS,
  applyPrivacyShiftForStorage,
  approximateShiftDistanceMeters,
} from './privacy-shift.js';

const basePoint = { latitude: -12.5423, longitude: -55.7214 };

describe('applyPrivacyShiftForStorage', () => {
  it('should_keep_coordinates_when_privacy_is_public', () => {
    const shifted = applyPrivacyShiftForStorage(basePoint, 'public');
    expect(shifted).toEqual(basePoint);
  });

  it('should_offset_coordinates_when_privacy_is_approximate', () => {
    const shifted = applyPrivacyShiftForStorage(basePoint, 'approximate', () => 0.25);
    expect(shifted).not.toEqual(basePoint);
  });

  it('should_offset_between_90_and_110_meters_for_default_approximate', () => {
    const shifted = applyPrivacyShiftForStorage(basePoint, 'approximate', () => 0.5);
    const offset = approximateShiftDistanceMeters(basePoint, shifted);

    expect(offset).toBeGreaterThanOrEqual(APPROXIMATE_OFFSET_MIN_METERS);
    expect(offset).toBeLessThanOrEqual(APPROXIMATE_OFFSET_MAX_METERS);
  });

  it('should_keep_hidden_coordinates_internally', () => {
    const shifted = applyPrivacyShiftForStorage(basePoint, 'hidden');
    expect(shifted).toEqual(basePoint);
    expect(distanceMeters(basePoint, shifted)).toBe(0);
  });
});
