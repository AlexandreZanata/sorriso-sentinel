import type { OccurrenceKind } from '../../occurrences/value-objects/occurrence-kind.vo.js';

export interface ValidationPolicy {
  confirmBasePoints: number;
  denyBasePoints: number;
  minDistinctConfirmations: number;
  minWeightedScore: number;
  confidenceFloor: number;
}

const STANDARD_POLICY: ValidationPolicy = {
  confirmBasePoints: 20,
  denyBasePoints: 25,
  minDistinctConfirmations: 5,
  minWeightedScore: 100,
  confidenceFloor: 20,
};

const SENSITIVE_POLICY: ValidationPolicy = {
  confirmBasePoints: 20,
  denyBasePoints: 25,
  minDistinctConfirmations: 8,
  minWeightedScore: 160,
  confidenceFloor: 15,
};

const TEMPORARY_EVENT_POLICY: ValidationPolicy = {
  confirmBasePoints: 20,
  denyBasePoints: 25,
  minDistinctConfirmations: 3,
  minWeightedScore: 60,
  confidenceFloor: 20,
};

export function defaultValidationPolicy(): ValidationPolicy {
  return { ...STANDARD_POLICY };
}

export function resolveValidationPolicy(params: {
  isSensitive: boolean;
  occurrenceKind: OccurrenceKind;
}): ValidationPolicy {
  if (params.occurrenceKind === 'temporary_event') {
    return { ...TEMPORARY_EVENT_POLICY };
  }

  if (params.isSensitive) {
    return { ...SENSITIVE_POLICY };
  }

  return { ...STANDARD_POLICY };
}

export function parseValidationPolicy(value: ValidationPolicy): ValidationPolicy {
  if (value.minDistinctConfirmations < 1) {
    throw new Error('Validation policy minDistinctConfirmations must be positive');
  }

  return { ...value };
}
