import { describe, expect, it } from 'vitest';
import { parsePqcPublicKeyRef } from './pqc-public-key-ref.vo.js';

describe('PqcPublicKeyRef', () => {
  it('should_accept_valid_pqc_public_key_ref_fingerprint', () => {
    const ref = 'a'.repeat(64);
    expect(parsePqcPublicKeyRef(ref)).toBe(ref);
  });

  it('should_reject_fingerprint_shorter_than_32_chars', () => {
    expect(() => parsePqcPublicKeyRef('abc123')).toThrow(
      /Invalid PQC public key reference/,
    );
  });
});
