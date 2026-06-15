import { describe, expect, it } from 'vitest';
import { EmailVerifiedEvent } from './email-verified.event.js';

describe('EmailVerifiedEvent', () => {
  it('should_not_include_device_digest_in_event_payload', () => {
    const event = new EmailVerifiedEvent({
      userAccountId: 'account-1',
      cityId: 'city-1',
      contributorId: 'contributor-1',
    });

    expect(JSON.stringify(event.payload)).not.toMatch(/digest/i);
    expect(event.payload).not.toHaveProperty('email');
  });
});
