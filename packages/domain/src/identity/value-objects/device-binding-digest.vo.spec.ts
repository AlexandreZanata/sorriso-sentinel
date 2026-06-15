import { describe, expect, it } from 'vitest';
import { parseDeviceBindingDigest } from './device-binding-digest.vo.js';

describe('DeviceBindingDigest', () => {
  const validDigest = 'a'.repeat(64);

  it('should_accept_valid_64_char_hex_digest', () => {
    expect(parseDeviceBindingDigest(validDigest)).toBe(validDigest);
  });

  it('should_reject_device_binding_digest_with_wrong_length', () => {
    expect(() => parseDeviceBindingDigest('abc123')).toThrow(
      /Invalid device binding digest/,
    );
  });
});
