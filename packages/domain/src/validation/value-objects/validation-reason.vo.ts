import type { ValidationVoteType } from './validation-vote-type.vo.js';

export const CONFIRM_VALIDATION_REASONS = [
  'still_there',
  'verified_locally',
  'other',
] as const;

export const DENY_VALIDATION_REASONS = [
  'false_alarm',
  'duplicate',
  'already_resolved',
  'other',
] as const;

export type ConfirmValidationReason = (typeof CONFIRM_VALIDATION_REASONS)[number];
export type DenyValidationReason = (typeof DENY_VALIDATION_REASONS)[number];

export class InvalidValidationReasonError extends Error {
  constructor(reason: string) {
    super(`Invalid validation reason: ${reason}`);
    this.name = 'InvalidValidationReasonError';
  }
}

export function parseValidationReason(
  voteType: ValidationVoteType,
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }

  const trimmed = value.trim();
  const allowed =
    voteType === 'confirm' ? CONFIRM_VALIDATION_REASONS : DENY_VALIDATION_REASONS;

  if (!allowed.includes(trimmed as ConfirmValidationReason & DenyValidationReason)) {
    throw new InvalidValidationReasonError(trimmed);
  }

  return trimmed;
}
