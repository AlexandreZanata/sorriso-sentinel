import { describe, expect, it } from 'vitest';
import { parseValidationReason } from './validation-reason.vo.js';

describe('ValidationReason', () => {
  it('should_accept_confirm_reason', () => {
    expect(parseValidationReason('confirm', 'still_there')).toBe('still_there');
  });

  it('should_accept_deny_reason', () => {
    expect(parseValidationReason('deny', 'false_alarm')).toBe('false_alarm');
  });

  it('should_allow_null_reason', () => {
    expect(parseValidationReason('confirm', null)).toBeNull();
  });

  it('should_reject_reason_not_allowed_for_vote_type', () => {
    expect(() => parseValidationReason('confirm', 'false_alarm')).toThrow(
      /Invalid validation reason/,
    );
  });
});
