import { describe, expect, it } from 'vitest';
import { MediaLimitPolicy } from './media-limit.policy.js';
import { DEFAULT_MEDIA_UPLOAD_POLICY } from '../value-objects/media-upload-policy.vo.js';

describe('MediaLimitPolicy', () => {
  const policy = DEFAULT_MEDIA_UPLOAD_POLICY;

  it('should_forbid_sixth_media_on_occurrence', () => {
    const limitPolicy = new MediaLimitPolicy();

    expect(limitPolicy.canAttachMore(4, policy)).toBe(true);
    expect(limitPolicy.canAttachMore(5, policy)).toBe(false);
    expect(() => limitPolicy.assertCanAttachMore(5, policy)).toThrow(
      'Media limit reached',
    );
  });

  it('should_forbid_slot_when_hourly_limit_reached', () => {
    const limitPolicy = new MediaLimitPolicy();

    expect(limitPolicy.canRequestSlot(19, policy)).toBe(true);
    expect(limitPolicy.canRequestSlot(20, policy)).toBe(false);
    expect(() => limitPolicy.assertCanRequestSlot(20, policy)).toThrow(
      'Upload slot rate limit reached',
    );
  });
});
