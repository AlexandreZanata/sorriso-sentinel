import type { Coordinates } from './coordinates.js';
import { distanceMeters } from './coordinates.js';

export const APPROXIMATE_OFFSET_MIN_METERS = 90;
export const APPROXIMATE_OFFSET_MAX_METERS = 110;
const DEFAULT_APPROXIMATE_OFFSET_METERS = 100;

type PrivacyLevel = 'public' | 'neighborhood' | 'approximate' | 'hidden';

function metersToLatOffset(meters: number): number {
  return meters / 111_320;
}

function metersToLonOffset(meters: number, latitude: number): number {
  const cosLat = Math.cos((latitude * Math.PI) / 180);
  return meters / (111_320 * Math.max(cosLat, 0.01));
}

export function approximateShiftDistanceMeters(
  from: Coordinates,
  to: Coordinates,
): number {
  return distanceMeters(from, to);
}

export function applyPrivacyShiftForStorage(
  location: Coordinates,
  privacyLevel: PrivacyLevel,
  random: () => number = Math.random,
): Coordinates {
  if (privacyLevel === 'approximate') {
    const fraction = random();
    const offsetMeters =
      APPROXIMATE_OFFSET_MIN_METERS +
      fraction * (APPROXIMATE_OFFSET_MAX_METERS - APPROXIMATE_OFFSET_MIN_METERS);
    const bearing = random() * 2 * Math.PI;
    const latOffset = metersToLatOffset(offsetMeters) * Math.cos(bearing);
    const lonOffset = metersToLonOffset(offsetMeters, location.latitude) * Math.sin(bearing);

    return {
      latitude: location.latitude + latOffset,
      longitude: location.longitude + lonOffset,
    };
  }

  return location;
}
