import { isValidCoordinates } from '@sorriso-sentinel/geo';

export interface ProblemLocation {
  latitude: number;
  longitude: number;
}

export class InvalidProblemLocationError extends Error {
  constructor(reason: string) {
    super(`Invalid problem location: ${reason}`);
    this.name = 'InvalidProblemLocationError';
  }
}

export function parseProblemLocation(value: ProblemLocation): ProblemLocation {
  if (!isValidCoordinates(value)) {
    if (value.latitude < -90 || value.latitude > 90) {
      throw new InvalidProblemLocationError('latitude must be between -90 and 90');
    }

    throw new InvalidProblemLocationError('longitude must be between -180 and 180');
  }

  return {
    latitude: value.latitude,
    longitude: value.longitude,
  };
}
