import { applyPrivacyShiftForStorage } from '@sorriso-sentinel/geo';
import type { PrivacyLevel } from '../value-objects/privacy-level.vo.js';
import type { ProblemLocation } from '../value-objects/problem-location.vo.js';

export interface MapLocation {
  latitude: number;
  longitude: number;
}

export class LocationPrivacyService {
  applyForStorage(
    problemLocation: ProblemLocation,
    privacyLevel: PrivacyLevel,
    random?: () => number,
  ): MapLocation {
    return applyPrivacyShiftForStorage(problemLocation, privacyLevel, random);
  }
}
