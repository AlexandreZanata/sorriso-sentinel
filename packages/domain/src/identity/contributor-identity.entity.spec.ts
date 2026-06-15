import { describe, expect, it } from 'vitest';
import {
  ContributorIdentity,
  IdentityRotationProofError,
  InvalidIdentityModeChangeError,
} from './contributor-identity.entity.js';
import { DEFAULT_IDENTITY_MODE } from './value-objects/identity-mode.vo.js';

describe('ContributorIdentity', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('should_assign_reputation_id_on_session_bootstrap', () => {
    const identity = ContributorIdentity.bootstrap({
      id: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e6f',
      cityId: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e70',
      reputationId: 'Rep-8F29A',
      localKeyRef: 'fingerprint-abc12345',
      clock: () => now,
    });

    expect(identity.reputationId).toBe('Rep-8F29A');
    expect(identity.id).toBe('018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e6f');
  });

  it('should_start_in_ghost_mode_on_bootstrap', () => {
    const identity = ContributorIdentity.bootstrap({
      id: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e6f',
      cityId: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e70',
      reputationId: 'Rep-8F29A',
      localKeyRef: 'fingerprint-abc12345',
      clock: () => now,
    });

    expect(identity.identityMode).toBe(DEFAULT_IDENTITY_MODE);
    expect(identity.pseudonym).toBeNull();
  });

  it('should_change_mode_from_ghost_to_pseudonym', () => {
    const identity = ContributorIdentity.bootstrap({
      id: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e6f',
      cityId: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e70',
      reputationId: 'Rep-8F29A',
      localKeyRef: 'fingerprint-abc12345',
      clock: () => now,
    });

    identity.changeMode('pseudonym', 'JoaoDoCentro', () => now);

    expect(identity.identityMode).toBe('pseudonym');
    expect(identity.pseudonym).toBe('JoaoDoCentro');
    expect(identity.version).toBe(2);
  });

  it('should_reject_pseudonym_mode_without_handle', () => {
    const identity = ContributorIdentity.bootstrap({
      id: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e6f',
      cityId: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e70',
      reputationId: 'Rep-8F29A',
      localKeyRef: 'fingerprint-abc12345',
      clock: () => now,
    });

    expect(() => identity.changeMode('pseudonym', undefined, () => now)).toThrow(
      InvalidIdentityModeChangeError,
    );
  });

  it('should_preserve_reputation_id_on_identity_rotation', () => {
    const identity = ContributorIdentity.bootstrap({
      id: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e6f',
      cityId: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e70',
      reputationId: 'Rep-8F29A',
      localKeyRef: 'fingerprint-abc12345',
      clock: () => now,
    });

    identity.rotate({
      newLocalKeyRef: 'fingerprint-xyz98765',
      verifyProof: () => true,
      clock: () => now,
    });

    expect(identity.reputationId).toBe('Rep-8F29A');
    expect(identity.localKeyRef).toBe('fingerprint-xyz98765');
  });

  it('should_reject_rotation_without_valid_cryptographic_proof', () => {
    const identity = ContributorIdentity.bootstrap({
      id: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e6f',
      cityId: '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e70',
      reputationId: 'Rep-8F29A',
      localKeyRef: 'fingerprint-abc12345',
      clock: () => now,
    });

    expect(() =>
      identity.rotate({
        newLocalKeyRef: 'fingerprint-xyz98765',
        verifyProof: () => false,
        clock: () => now,
      }),
    ).toThrow(IdentityRotationProofError);
  });
});
