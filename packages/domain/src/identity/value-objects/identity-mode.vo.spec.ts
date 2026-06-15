import { describe, expect, it } from 'vitest';
import {
  DEFAULT_IDENTITY_MODE,
  InvalidIdentityModeError,
  parseIdentityMode,
} from './identity-mode.vo.js';

describe('IdentityMode', () => {
  it('should_default_identity_mode_to_ghost', () => {
    expect(DEFAULT_IDENTITY_MODE).toBe('ghost');
    expect(parseIdentityMode('ghost')).toBe('ghost');
  });

  it('should_reject_invalid_identity_mode_enum', () => {
    expect(() => parseIdentityMode('anonymous')).toThrow(InvalidIdentityModeError);
    expect(() => parseIdentityMode('')).toThrow(InvalidIdentityModeError);
  });

  it('should_accept_pseudonym_and_public_modes', () => {
    expect(parseIdentityMode('pseudonym')).toBe('pseudonym');
    expect(parseIdentityMode('public')).toBe('public');
  });
});
