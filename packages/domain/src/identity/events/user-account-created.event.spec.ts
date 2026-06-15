import { describe, expect, it } from 'vitest';
import { UserAccountCreatedEvent } from './user-account-created.event.js';

describe('UserAccountCreatedEvent', () => {
  it('should_not_include_email_in_user_account_created_payload', () => {
    const event = new UserAccountCreatedEvent({
      userAccountId: 'account-1',
      cityId: 'city-1',
      contributorId: 'contributor-1',
      status: 'pending_verification',
    });

    expect(JSON.stringify(event.payload)).not.toMatch(/@/);
    expect(event.payload).not.toHaveProperty('email');
    expect(event.payload).not.toHaveProperty('deviceBindingDigest');
  });
});
