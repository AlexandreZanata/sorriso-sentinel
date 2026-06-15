import { describe, expect, it, vi } from 'vitest';
import type { AbuseSignalPort } from '../ports/abuse-signal.port.js';
import {
  DeviceAlreadyRegisteredError,
  SingleAccountPerDevicePolicy,
} from './single-account-per-device.policy.js';

describe('SingleAccountPerDevicePolicy', () => {
  const digest = 'b'.repeat(64);

  it('should_reject_registration_when_device_already_registered', async () => {
    const abuseSignal: AbuseSignalPort = {
      isDeviceAlreadyRegistered: vi.fn().mockResolvedValue(true),
      registerDeviceBinding: vi.fn(),
    };

    await expect(
      SingleAccountPerDevicePolicy.assertUniqueDevice({
        cityId: 'city-1',
        deviceBindingDigest: digest,
        abuseSignal,
      }),
    ).rejects.toThrow(DeviceAlreadyRegisteredError);
  });

  it('should_allow_registration_when_device_digest_is_new', async () => {
    const abuseSignal: AbuseSignalPort = {
      isDeviceAlreadyRegistered: vi.fn().mockResolvedValue(false),
      registerDeviceBinding: vi.fn(),
    };

    await expect(
      SingleAccountPerDevicePolicy.assertUniqueDevice({
        cityId: 'city-1',
        deviceBindingDigest: digest,
        abuseSignal,
      }),
    ).resolves.toBeUndefined();
  });
});
