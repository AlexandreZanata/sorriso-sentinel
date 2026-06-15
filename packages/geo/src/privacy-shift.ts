import type { Coordinates } from './coordinates.js';
import { distanceMeters } from './coordinates.js';

export type PrivacyLevelForShift = 'public' | 'neighborhood' | 'approximate' | 'hidden';

const EARTH_RADIUS_METERS = 6_371_000;
export const APPROXIMATE_OFFSET_MIN_METERS = 90;
export const APPROXIMATE_OFFSET_MAX_METERS = 110;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function destinationPoint(
  from: Coordinates,
  distanceMetersValue: number,
  bearingRadians: number,
): Coordinates {
  const lat1 = toRadians(from.latitude);
  const lon1 = toRadians(from.longitude);
  const angularDistance = distanceMetersValue / EARTH_RADIUS_METERS;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRadians),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearingRadians) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    latitude: toDegrees(lat2),
    longitude: toDegrees(lon2),
  };
}

export function applyPrivacyShiftForStorage(
  problemLocation: Coordinates,
  privacyLevel: PrivacyLevelForShift,
  random: () => number = Math.random,
): Coordinates {
  if (privacyLevel !== 'approximate') {
    return {
      latitude: problemLocation.latitude,
      longitude: problemLocation.longitude,
    };
  }

  const bearing = random() * 2 * Math.PI;
  const distance =
    APPROXIMATE_OFFSET_MIN_METERS +
    random() * (APPROXIMATE_OFFSET_MAX_METERS - APPROXIMATE_OFFSET_MIN_METERS);

  return destinationPoint(problemLocation, distance, bearing);
}

export function approximateShiftDistanceMeters(
  from: Coordinates,
  shifted: Coordinates,
): number {
  return distanceMeters(from, shifted);
}
